import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'admin_home_screen.dart';

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
  String? _imageId;
  String? _modelId;
  String? _jobId;
  Map<String, dynamic>? _job;
  String? _error;
  bool _busy = false;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _productId = widget.productId;
    _load();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final repo = ref.read(adminRepoProvider);
    try {
      final models = await repo.aiModels();
      Map<String, dynamic>? product;
      if (_productId != null) {
        product = await repo.product(_productId!);
      }
      setState(() {
        _models = models;
        _product = product;
        final images = (product?['images'] as List?) ?? [];
        if (images.isNotEmpty) {
          _imageId = (images.first as Map)['id']?.toString();
        }
      });
    } catch (e) {
      setState(() => _error = '$e');
    }
  }

  Future<void> _generate() async {
    if (_productId == null || _imageId == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final job = await ref.read(adminRepoProvider).generateAi({
        'productId': _productId,
        'productImageId': _imageId,
        'type': 'PRODUCT_TO_MODEL',
        'modelId': _modelId,
        'numImages': 1,
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
      }
    } catch (_) {}
  }

  Future<void> _approve(String as) async {
    if (_jobId == null) return;
    await ref.read(adminRepoProvider).approveJob(_jobId!, as);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved to product')));
    }
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
            onPressed: () => context.push('/admin/ai-settings'),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(_product?['name']?.toString() ?? 'Select a product from Products tab'),
          const SizedBox(height: 12),
          if (images.isNotEmpty)
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
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
                child: Text('Generating AI Fashion Image… You can leave this screen; the job continues.'),
              ),
            if (output != null) ...[
              const SizedBox(height: 12),
              Image.network(output),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  FilledButton(onPressed: () => _approve('gallery'), child: const Text('Approve')),
                  OutlinedButton(onPressed: () => _approve('primary'), child: const Text('Set primary')),
                  if (status == 'FAILED')
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
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }
}
