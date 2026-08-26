import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';
import 'admin_reauth.dart';
import 'admin_shell.dart';

class AdminProductEditScreen extends ConsumerStatefulWidget {
  const AdminProductEditScreen({super.key, required this.productId});

  final String productId;

  @override
  ConsumerState<AdminProductEditScreen> createState() => _AdminProductEditScreenState();
}

class _AdminProductEditScreenState extends ConsumerState<AdminProductEditScreen> {
  final _name = TextEditingController();
  final _description = TextEditingController();
  String _status = 'draft';
  bool _tryOnEnabled = false;
  String? _tryOnImageId;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  List<String> _perms = [];
  List<Map<String, dynamic>> _images = [];
  Map<String, dynamic>? _product;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(adminRepoProvider);
      final me = await repo.me();
      final perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      final p = await repo.product(widget.productId);
      final images = ((p['images'] as List?) ?? [])
          .whereType<Map>()
          .map((i) => Map<String, dynamic>.from(i))
          .toList();
      Map<String, dynamic>? tryOn;
      for (final i in images) {
        if (i['isTryOnSource'] == true) {
          tryOn = i;
          break;
        }
      }
      if (!mounted) return;
      setState(() {
        _perms = perms;
        _product = p;
        _name.text = p['name']?.toString() ?? '';
        _description.text = p['description']?.toString() ?? '';
        _status = p['status']?.toString() ?? 'draft';
        _tryOnEnabled = p['tryOnEnabled'] == true;
        _images = images;
        _tryOnImageId = tryOn?['id']?.toString();
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '$e';
          _loading = false;
        });
      }
    }
  }

  Future<void> _save({String? statusOverride, Map<String, dynamic>? extra}) async {
    if (!adminHasAny(_perms, ['products.update'])) return;
    setState(() => _saving = true);
    try {
      await ref.read(adminRepoProvider).updateProduct(widget.productId, {
        'name': _name.text.trim(),
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'status': statusOverride ?? _status,
        'tryOnEnabled': _tryOnEnabled,
        if (_tryOnImageId != null) 'tryOnImageId': _tryOnImageId,
        ...?extra,
      });
      if (statusOverride != null) _status = statusOverride;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product saved')));
        await _load();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _addImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('Camera'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;
    final shot = await ImagePicker().pickImage(source: source, imageQuality: 85);
    if (shot == null) return;
    setState(() => _saving = true);
    try {
      final upload = await ref.read(adminRepoProvider).uploadImage(shot.path);
      final url = upload['url']?.toString();
      if (url == null) throw Exception('Upload returned no URL');
      await ref.read(adminRepoProvider).updateProduct(widget.productId, {
        'imageUrls': [url],
      });
      await _load();
      if (!mounted) return;
      Map<String, dynamic>? added;
      for (final i in _images.reversed) {
        if (i['url']?.toString() == url) {
          added = i;
          break;
        }
      }
      added ??= _images.isEmpty ? null : _images.last;
      final imageId = added?['id']?.toString();
      if (imageId != null) {
        final asPrimary = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Primary image'),
                content: const Text('Set this image as the primary product image?'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
                  FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes')),
                ],
              ),
            ) ??
            false;
        if (!mounted) return;
        final asTryOn = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('TRY ME source'),
                content: const Text('Use this image as the TRY ME garment source?'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
                  FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes')),
                ],
              ),
            ) ??
            false;
        if (!mounted) return;
        final patch = <String, dynamic>{};
        if (asPrimary) patch['primaryImageId'] = imageId;
        if (asTryOn) {
          patch['tryOnImageId'] = imageId;
          _tryOnImageId = imageId;
        }
        if (patch.isNotEmpty) {
          await ref.read(adminRepoProvider).updateProduct(widget.productId, patch);
          await _load();
        }
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _setPrimary(String imageId) async {
    await _save(extra: {'primaryImageId': imageId});
  }

  Future<void> _setTryOnSource(String imageId) async {
    setState(() => _tryOnImageId = imageId);
    await _save(extra: {'tryOnImageId': imageId});
  }

  Future<void> _delete() async {
    if (!adminHasAny(_perms, ['products.delete'])) return;
    final confirmed = await confirmStaffReauth(context, ref, title: 'Confirm delete product');
    if (!confirmed) return;
    try {
      await ref.read(adminRepoProvider).deleteProduct(widget.productId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product deleted')));
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final canUpdate = adminHasAny(_perms, ['products.update']);
    final canDelete = adminHasAny(_perms, ['products.delete']);
    final primaryUrl = _images.isNotEmpty ? _images.first['url']?.toString() : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(_product?['name']?.toString() ?? 'Edit product'),
        actions: [
          if (canDelete)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: _saving ? null : _delete,
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, textAlign: TextAlign.center),
                      TextButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    TextField(
                      controller: _name,
                      enabled: canUpdate,
                      decoration: const InputDecoration(labelText: 'Name'),
                    ),
                    TextField(
                      controller: _description,
                      enabled: canUpdate,
                      maxLines: 4,
                      decoration: const InputDecoration(labelText: 'Description'),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'draft', child: Text('Draft')),
                        DropdownMenuItem(value: 'published', child: Text('Published')),
                        DropdownMenuItem(value: 'archived', child: Text('Archived')),
                      ],
                      onChanged: canUpdate
                          ? (v) {
                              if (v != null) setState(() => _status = v);
                            }
                          : null,
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('TRY ME enabled'),
                      value: _tryOnEnabled,
                      onChanged: canUpdate
                          ? (v) => setState(() => _tryOnEnabled = v)
                          : null,
                    ),
                    const SizedBox(height: 8),
                    Text('Images', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ..._images.map((img) {
                      final url = img['url']?.toString() ?? '';
                      final id = img['id']?.toString();
                      final isPrimary = url == primaryUrl;
                      final isTryOn = id != null && id == _tryOnImageId;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: url.isEmpty
                              ? const Icon(Icons.image_not_supported)
                              : Image.network(url, width: 56, height: 56, fit: BoxFit.cover),
                          title: Text(
                            [
                              if (isPrimary) 'Primary',
                              if (isTryOn) 'TRY ME',
                              if (!isPrimary && !isTryOn) 'Gallery',
                            ].join(' · '),
                          ),
                          subtitle: canUpdate && id != null
                              ? Wrap(
                                  spacing: 8,
                                  children: [
                                    if (!isPrimary)
                                      TextButton(
                                        onPressed: _saving ? null : () => _setPrimary(id),
                                        child: const Text('Set primary'),
                                      ),
                                    if (!isTryOn)
                                      TextButton(
                                        onPressed: _saving ? null : () => _setTryOnSource(id),
                                        child: const Text('TRY ME source'),
                                      ),
                                  ],
                                )
                              : null,
                        ),
                      );
                    }),
                    if (canUpdate)
                      OutlinedButton.icon(
                        onPressed: _saving ? null : _addImage,
                        icon: const Icon(Icons.add_a_photo),
                        label: const Text('Add camera / gallery'),
                      ),
                    if (_saving) const LinearProgressIndicator(),
                    const SizedBox(height: 16),
                    if (canUpdate) ...[
                      FilledButton(
                        onPressed: _saving ? null : () => _save(),
                        child: const Text('Save'),
                      ),
                      const SizedBox(height: 8),
                      if (_status != 'published')
                        OutlinedButton(
                          onPressed: _saving ? null : () => _save(statusOverride: 'published'),
                          child: const Text('Publish'),
                        ),
                      if (_status == 'published')
                        OutlinedButton(
                          onPressed: _saving ? null : () => _save(statusOverride: 'draft'),
                          child: const Text('Unpublish'),
                        ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => context.push('/admin/ai?productId=${widget.productId}'),
                        child: const Text('Open AI Fashion'),
                      ),
                    ],
                  ],
                ),
    );
  }
}
