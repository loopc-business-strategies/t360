import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'admin_home_screen.dart';
import 'admin_video_preview.dart';

class AdminAiScreen extends ConsumerStatefulWidget {
  const AdminAiScreen({super.key, this.productId});

  final String? productId;

  @override
  ConsumerState<AdminAiScreen> createState() => _AdminAiScreenState();
}

class _AdminAiScreenState extends ConsumerState<AdminAiScreen> {
  String? _productId;
  Map<String, dynamic>? _product;
  List<dynamic> _models = [];
  List<dynamic> _products = [];
  List<dynamic> _history = [];
  String? _imageId;
  String? _modelId;
  String? _jobId;
  Map<String, dynamic>? _job;
  String? _error;
  bool _busy = false;
  bool _showAdvanced = false;
  Timer? _poll;

  String _gender = 'female';
  String _pose = 'standing';
  String _background = 'studio';
  int _numImages = 1;
  String _resolution = '1k';
  String _generationMode = 'fast';
  final _customPrompt = TextEditingController();

  @override
  void initState() {
    super.initState();
    _productId = widget.productId;
    _load();
  }

  @override
  void dispose() {
    _poll?.cancel();
    _customPrompt.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final repo = ref.read(adminRepoProvider);
    try {
      final models = await repo.aiModels(activeOnly: true);
      final products = await repo.products();
      Map<String, dynamic>? settings;
      try {
        settings = await repo.aiSettings();
      } catch (_) {}

      Map<String, dynamic>? product;
      List<dynamic> history = [];
      if (_productId != null) {
        product = await repo.product(_productId!);
        history = await repo.aiJobs(productId: _productId);
      } else {
        history = await repo.aiJobs();
      }
      setState(() {
        _models = models;
        _products = products;
        _product = product;
        _history = history;
        if (settings != null) {
          final defModel = settings['defaultModelId']?.toString();
          if (_modelId == null && defModel != null && defModel.isNotEmpty) {
            _modelId = defModel;
          }
          _numImages = (settings['defaultNumImages'] as num?)?.toInt() ?? _numImages;
          _resolution = settings['defaultResolution']?.toString() ?? _resolution;
          _generationMode = settings['defaultGenerationMode']?.toString() ?? _generationMode;
        }
        final images = (product?['images'] as List?) ?? [];
        if (images.isNotEmpty && _imageId == null) {
          _imageId = (images.first as Map)['id']?.toString();
        }
      });
    } catch (e) {
      setState(() => _error = '$e');
    }
  }

  Future<void> _selectProduct(String? id) async {
    _productId = id;
    _jobId = null;
    _job = null;
    _imageId = null;
    await _load();
  }

  Future<void> _generate() async {
    if (_productId == null || _imageId == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final prompt = _customPrompt.text.trim();
      final job = await ref.read(adminRepoProvider).generateAi({
        'productId': _productId,
        'productImageId': _imageId,
        'type': 'PRODUCT_TO_MODEL',
        'modelId': _modelId,
        if (_modelId == null) 'gender': _gender,
        'pose': _pose,
        'background': _background,
        'numImages': _numImages,
        'resolution': _resolution,
        'generationMode': _generationMode,
        if (prompt.isNotEmpty) 'customPrompt': prompt,
      });
      _jobId = job['id']?.toString();
      _job = job;
      _poll?.cancel();
      _poll = Timer.periodic(const Duration(seconds: 3), (_) => _refreshJob());
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _refreshJob() async {
    if (_jobId == null) return;
    try {
      final job = await ref.read(adminRepoProvider).aiJob(_jobId!);
      setState(() => _job = job);
      final status = job['status']?.toString();
      if (status == 'COMPLETED' || status == 'FAILED' || status == 'CANCELLED') {
        _poll?.cancel();
        _history = await ref.read(adminRepoProvider).aiJobs(productId: _productId);
        setState(() {});
      }
    } catch (_) {}
  }

  Future<void> _approve(String as) async {
    if (_jobId == null) return;
    await ref.read(adminRepoProvider).approveJob(_jobId!, as);
    if (_productId != null) {
      final product = await ref.read(adminRepoProvider).product(_productId!);
      if (mounted) setState(() => _product = product);
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved to product')));
    }
  }

  Widget _dropdown({
    required String label,
    required String value,
    required List<String> options,
    required ValueChanged<String> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      key: ValueKey('$label-$value'),
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: options
          .map((o) => DropdownMenuItem(value: o, child: Text(o)))
          .toList(),
      onChanged: (v) {
        if (v != null) onChanged(v);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final images = (_product?['images'] as List?) ?? [];
    final status = _job?['status']?.toString();
    final output = _job?['outputImageUrl']?.toString();

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Fashion'),
        actions: [
          IconButton(
            onPressed: () => context.push('/admin/ai-usage'),
            icon: const Icon(Icons.bar_chart_outlined),
            tooltip: 'Usage',
          ),
          IconButton(
            onPressed: () => context.push('/admin/ai-images'),
            icon: const Icon(Icons.image_outlined),
            tooltip: 'Images',
          ),
          IconButton(
            onPressed: () => context.push('/admin/ai-models'),
            icon: const Icon(Icons.people_outline),
          ),
          IconButton(
            onPressed: () => context.push('/admin/ai-settings'),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<String?>(
            key: ValueKey('product-$_productId'),
            initialValue: _productId,
            decoration: const InputDecoration(labelText: 'Product'),
            items: [
              const DropdownMenuItem(value: null, child: Text('Select product')),
              ..._products.map((p) {
                final map = p as Map;
                return DropdownMenuItem(
                  value: map['id']?.toString(),
                  child: Text(map['name']?.toString() ?? 'Product'),
                );
              }),
            ],
            onChanged: (v) => _selectProduct(v),
          ),
          const SizedBox(height: 12),
          if (images.isNotEmpty)
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final img = images[i] as Map;
                  final id = img['id']?.toString();
                  final selected = id == _imageId;
                  return GestureDetector(
                    onTap: () => setState(() => _imageId = id),
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: selected ? Colors.brown : Colors.grey, width: 2),
                      ),
                      child: Image.network(img['url']?.toString() ?? '', width: 80, fit: BoxFit.cover),
                    ),
                  );
                },
              ),
            ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String?>(
            key: ValueKey('model-$_modelId'),
            initialValue: _modelId,
            decoration: const InputDecoration(labelText: 'AI Model'),
            items: [
              const DropdownMenuItem(value: null, child: Text('Auto (product-to-model)')),
              ..._models.map((m) {
                final map = m as Map;
                return DropdownMenuItem(
                  value: map['id']?.toString(),
                  child: Text(map['name']?.toString() ?? 'Model'),
                );
              }),
            ],
            onChanged: (v) => setState(() => _modelId = v),
          ),
          if (_modelId == null) ...[
            const SizedBox(height: 8),
            _dropdown(
              label: 'Gender',
              value: _gender,
              options: const ['female', 'male', 'unisex'],
              onChanged: (v) => setState(() => _gender = v),
            ),
          ],
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Advanced options'),
            value: _showAdvanced,
            onChanged: (v) => setState(() => _showAdvanced = v),
          ),
          if (_showAdvanced) ...[
            _dropdown(
              label: 'Pose',
              value: _pose,
              options: const ['standing', 'casual', 'fashion', 'custom'],
              onChanged: (v) => setState(() => _pose = v),
            ),
            _dropdown(
              label: 'Background',
              value: _background,
              options: const ['studio', 'white', 'outdoor', 'custom'],
              onChanged: (v) => setState(() => _background = v),
            ),
            DropdownButtonFormField<int>(
              key: ValueKey('num-$_numImages'),
              initialValue: _numImages,
              decoration: const InputDecoration(labelText: 'Images'),
              items: const [
                DropdownMenuItem(value: 1, child: Text('1')),
                DropdownMenuItem(value: 2, child: Text('2')),
                DropdownMenuItem(value: 4, child: Text('4')),
              ],
              onChanged: (v) => setState(() => _numImages = v ?? 1),
            ),
            _dropdown(
              label: 'Resolution',
              value: _resolution,
              options: const ['1k', '2k', '4k'],
              onChanged: (v) => setState(() => _resolution = v),
            ),
            _dropdown(
              label: 'Quality',
              value: _generationMode,
              options: const ['fast', 'balanced', 'quality'],
              onChanged: (v) => setState(() => _generationMode = v),
            ),
            TextField(
              controller: _customPrompt,
              decoration: const InputDecoration(labelText: 'Custom prompt'),
              maxLines: 3,
            ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy || _productId == null || _imageId == null ? null : _generate,
            child: Text(_busy ? 'Submitting…' : 'GENERATE'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          if (status != null) ...[
            const SizedBox(height: 16),
            Text('Status: $status'),
            if (status == 'QUEUED' || status == 'PROCESSING')
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text('Generating… You can leave; the job continues on the server.'),
              ),
            if (output != null) ...[
              const SizedBox(height: 12),
              if (adminJobIsVideo(_job ?? {}))
                AdminVideoPreview(url: output)
              else
                Image.network(output),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  FilledButton(onPressed: () => _approve('gallery'), child: const Text('Approve')),
                  OutlinedButton(onPressed: () => _approve('primary'), child: const Text('Set primary')),
                  if (!adminJobIsVideo(_job ?? {}))
                    OutlinedButton(
                      onPressed: _busy || _jobId == null
                          ? null
                          : () async {
                              setState(() {
                                _busy = true;
                                _error = null;
                              });
                              try {
                                final job = await ref.read(adminRepoProvider).generateAi({
                                  'type': 'IMAGE_TO_VIDEO',
                                  'sourceJobId': _jobId,
                                  'productId': _productId,
                                  'duration': 5,
                                  'videoResolution': '720p',
                                });
                                setState(() {
                                  _jobId = job['id']?.toString();
                                  _job = job;
                                });
                                _poll?.cancel();
                                _poll = Timer.periodic(
                                  const Duration(seconds: 3),
                                  (_) => _refreshJob(),
                                );
                              } catch (e) {
                                setState(() => _error = '$e');
                              } finally {
                                setState(() => _busy = false);
                              }
                            },
                      child: const Text('Generate video'),
                    ),
                ],
              ),
            ],
            if (status == 'FAILED' || status == 'CANCELLED')
              OutlinedButton(
                onPressed: () async {
                  final job = await ref.read(adminRepoProvider).retryJob(_jobId!);
                  setState(() {
                    _jobId = job['id']?.toString();
                    _job = job;
                  });
                  _poll?.cancel();
                  _poll = Timer.periodic(const Duration(seconds: 3), (_) => _refreshJob());
                },
                child: const Text('Retry'),
              ),
            if (_jobId != null)
              TextButton(
                onPressed: () async {
                  await ref.read(adminRepoProvider).deleteJob(_jobId!);
                  setState(() {
                    _jobId = null;
                    _job = null;
                  });
                  await _load();
                },
                child: const Text('Cancel / Delete job'),
              ),
          ],
          const SizedBox(height: 24),
          Text('Recent jobs', style: Theme.of(context).textTheme.titleMedium),
          ..._history.take(15).map((j) {
            final map = j as Map;
            return ListTile(
              dense: true,
              title: Text('${map['status']} · ${map['type']}'),
              subtitle: Text(map['product']?['name']?.toString() ?? map['productId']?.toString() ?? ''),
              onTap: () {
                setState(() {
                  _jobId = map['id']?.toString();
                  _job = Map<String, dynamic>.from(map);
                  _productId = map['productId']?.toString() ?? _productId;
                });
              },
            );
          }),
        ],
      ),
    );
  }
}
