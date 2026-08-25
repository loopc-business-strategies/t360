import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/try_on_repository.dart';

/// In-memory reused person photo URL for "try another product".
final tryOnPhotoCacheProvider = StateProvider<String?>((ref) => null);

class TryOnFlowScreen extends ConsumerStatefulWidget {
  const TryOnFlowScreen({
    super.key,
    required this.productId,
    required this.productName,
    required this.productSlug,
    this.variantId,
    this.tryOnEnabled = true,
  });

  final String productId;
  final String productName;
  final String productSlug;
  final String? variantId;
  final bool tryOnEnabled;

  @override
  ConsumerState<TryOnFlowScreen> createState() => _TryOnFlowScreenState();
}

enum _Step { guide, preview, processing, result, failed }

class _TryOnFlowScreenState extends ConsumerState<TryOnFlowScreen> {
  _Step _step = _Step.guide;
  String? _localPath;
  String? _uploadedUrl;
  String? _uploadedPublicId;
  TryOnSessionDto? _session;
  String? _error;
  var _busy = false;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final cached = ref.read(tryOnPhotoCacheProvider);
    if (cached != null && cached.isNotEmpty) {
      _uploadedUrl = cached;
      _step = _Step.preview;
    }
  }

  Future<void> _pick(ImageSource source) async {
    setState(() => _error = null);
    try {
      final file = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        imageQuality: 85,
      );
      if (file == null) return;
      setState(() {
        _localPath = file.path;
        _step = _Step.preview;
        _busy = true;
      });
      final upload = await ref.read(tryOnRepositoryProvider).uploadPersonPhoto(file.path);
      setState(() {
        _uploadedUrl = upload['url']?.toString();
        _uploadedPublicId = upload['publicId']?.toString();
        _busy = false;
      });
      if (_uploadedUrl != null) {
        ref.read(tryOnPhotoCacheProvider.notifier).state = _uploadedUrl;
      }
    } catch (e) {
      setState(() {
        _busy = false;
        _error = e.toString();
        _step = _Step.failed;
      });
    }
  }

  Future<void> _start() async {
    final url = _uploadedUrl;
    if (url == null || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
      _step = _Step.processing;
    });
    try {
      final session = await ref.read(tryOnRepositoryProvider).create(
            productId: widget.productId,
            variantId: widget.variantId,
            inputImageUrl: url,
            inputPublicId: _uploadedPublicId,
            idempotencyKey: DateTime.now().millisecondsSinceEpoch.toString(),
          );
      setState(() => _session = session);
      await _poll(session.id);
    } catch (e) {
      setState(() {
        _busy = false;
        _error = e.toString();
        _step = _Step.failed;
      });
    }
  }

  Future<void> _poll(String id) async {
    for (var i = 0; i < 60; i++) {
      await Future<void>.delayed(Duration(milliseconds: i < 5 ? 2000 : 3500));
      if (!mounted) return;
      try {
        final s = await ref.read(tryOnRepositoryProvider).get(id);
        setState(() => _session = s);
        if (['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].contains(s.status)) {
          setState(() {
            _busy = false;
            if (s.status == 'COMPLETED') {
              _step = _Step.result;
            } else {
              _step = _Step.failed;
              _error = s.errorMessage ?? ref.read(stringsProvider).tryMeFailed;
            }
          });
          return;
        }
      } catch (_) {
        /* keep polling */
      }
    }
    setState(() {
      _busy = false;
      _step = _Step.failed;
      _error = ref.read(stringsProvider).tryMeFailed;
    });
  }

  Future<void> _addToCart() async {
    final vid = widget.variantId;
    if (vid == null) return;
    setState(() => _busy = true);
    try {
      await ref.read(cartRepositoryProvider).addItem(variantId: vid);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ref.read(stringsProvider).addToCart)),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _share() async {
    final url = _session?.resultImageUrl;
    if (url == null) return;
    await SharePlus.instance.share(ShareParams(text: url, subject: widget.productName));
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      appBar: TharagaiAppBar(title: t.tryMeTitle),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.productName, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          if (!widget.tryOnEnabled)
            Text(t.tryMeUnavailable, style: const TextStyle(color: TharagaiColors.muted)),
          if (widget.tryOnEnabled && _step == _Step.guide) ...[
            Text(t.tryMeGuide),
            const SizedBox(height: 16),
            TharagaiButton(
              label: t.tryMeTakePhoto,
              onPressed: _busy ? null : () => _pick(ImageSource.camera),
            ),
            const SizedBox(height: 8),
            TharagaiButton(
              label: t.tryMeUpload,
              variant: TharagaiButtonVariant.outline,
              onPressed: _busy ? null : () => _pick(ImageSource.gallery),
            ),
          ],
          if (widget.tryOnEnabled && _step == _Step.preview) ...[
            if (_localPath != null)
              AspectRatio(
                aspectRatio: 3 / 4,
                child: Image.file(File(_localPath!), fit: BoxFit.cover),
              )
            else if (_uploadedUrl != null)
              AspectRatio(
                aspectRatio: 3 / 4,
                child: Image.network(_uploadedUrl!, fit: BoxFit.cover),
              ),
            const SizedBox(height: 16),
            TharagaiButton(
              label: t.tryMeConfirm,
              onPressed: _busy || _uploadedUrl == null ? null : _start,
            ),
            const SizedBox(height: 8),
            TharagaiButton(
              label: t.tryMeRetake,
              variant: TharagaiButtonVariant.outline,
              onPressed: _busy
                  ? null
                  : () => setState(() {
                        _localPath = null;
                        _uploadedUrl = null;
                        _step = _Step.guide;
                      }),
            ),
          ],
          if (widget.tryOnEnabled && _step == _Step.processing) ...[
            Text(t.tryMeProcessing),
            const SizedBox(height: 12),
            Text('${t.tryMeStepPrepare}\n${t.tryMeStepMatch}\n${t.tryMeStepGenerate}\n${t.tryMeStepFinish}'),
            const SizedBox(height: 16),
            const Center(child: CircularProgressIndicator()),
            if (_session != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text('Status: ${_session!.status}'),
              ),
          ],
          if (widget.tryOnEnabled && _step == _Step.result && _session?.resultImageUrl != null) ...[
            Text(t.tryMeResult, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            AspectRatio(
              aspectRatio: 3 / 4,
              child: Image.network(_session!.resultImageUrl!, fit: BoxFit.cover),
            ),
            const SizedBox(height: 8),
            Text(t.tryMeDisclaimer, style: const TextStyle(fontSize: 12, color: TharagaiColors.muted)),
            const SizedBox(height: 16),
            TharagaiButton(label: t.tryMeShare, onPressed: _share),
            const SizedBox(height: 8),
            TharagaiButton(
              label: t.addToCart,
              onPressed: _busy || widget.variantId == null ? null : _addToCart,
            ),
            const SizedBox(height: 8),
            TharagaiButton(
              label: t.viewProduct,
              variant: TharagaiButtonVariant.outline,
              onPressed: () => context.go('/product/${widget.productSlug}'),
            ),
            const SizedBox(height: 8),
            TharagaiButton(
              label: t.tryMeAnother,
              variant: TharagaiButtonVariant.outline,
              onPressed: () => context.go('/categories'),
            ),
          ],
          if (widget.tryOnEnabled && _step == _Step.failed) ...[
            Text(_error ?? t.tryMeFailed, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            TharagaiButton(
              label: t.tryMeAgain,
              onPressed: _uploadedUrl == null
                  ? null
                  : () => setState(() {
                        _step = _Step.preview;
                        _error = null;
                      }),
            ),
            const SizedBox(height: 8),
            TharagaiButton(
              label: t.tryMeRetake,
              variant: TharagaiButtonVariant.outline,
              onPressed: () => setState(() {
                _step = _Step.guide;
                _localPath = null;
                _uploadedUrl = null;
              }),
            ),
          ],
          if (_error != null && _step != _Step.failed) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
        ],
      ),
    );
  }
}
