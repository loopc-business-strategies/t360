import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import 'admin_home_screen.dart';

class AdminProductsScreen extends ConsumerStatefulWidget {
  const AdminProductsScreen({super.key});

  @override
  ConsumerState<AdminProductsScreen> createState() => _AdminProductsScreenState();
}

class _AdminProductsScreenState extends ConsumerState<AdminProductsScreen> {
  late Future<List<dynamic>> _future;
  final _search = TextEditingController();
  String? _pendingPath;
  String? _attachProductId;

  @override
  void initState() {
    super.initState();
    _future = ref.read(adminRepoProvider).products();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _refresh({String? q}) async {
    setState(() => _future = ref.read(adminRepoProvider).products(q: q));
  }

  Future<void> _pick(ImageSource source, {String? attachToProductId}) async {
    final picker = ImagePicker();
    final shot = await picker.pickImage(source: source, imageQuality: 85);
    if (shot == null) return;
    setState(() {
      _pendingPath = shot.path;
      _attachProductId = attachToProductId;
    });
  }

  Future<void> _usePhoto() async {
    final path = _pendingPath;
    if (path == null) return;
    final repo = ref.read(adminRepoProvider);
    try {
      final upload = await repo.uploadImage(path);
      final url = upload['url']?.toString();
      if (url == null) throw Exception('Upload returned no URL');

      if (_attachProductId != null) {
        final existing = await repo.product(_attachProductId!);
        final images = (existing['images'] as List?) ?? [];
        final urls = [
          ...images.map((i) => (i as Map)['url']?.toString()).whereType<String>(),
          url,
        ];
        await repo.updateProduct(_attachProductId!, {'imageUrls': urls});
        if (mounted) {
          setState(() => _pendingPath = null);
          context.push('/admin/ai?productId=$_attachProductId');
        }
        return;
      }

      final cats = await repo.categories();
      final firstCat = cats.isNotEmpty ? cats.first as Map<String, dynamic> : null;
      final categoryId = firstCat?['id'] as String?;
      if (categoryId == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Create a category in web admin first')),
          );
        }
        return;
      }
      final sku = 'MOB-${DateTime.now().millisecondsSinceEpoch}';
      final product = await repo.createProduct({
        'name': 'Mobile capture $sku',
        'categoryId': categoryId,
        'status': 'draft',
        'imageUrls': [url],
        'generateAiFashion': false,
        'variants': [
          {'sku': sku, 'price': 999, 'attributes': {'size': 'M', 'colour': 'Blue'}},
        ],
      });
      if (mounted) {
        setState(() => _pendingPath = null);
        context.push('/admin/ai?productId=${product['id']}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  void _showCaptureSheet({String? productId}) {
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('Camera'),
              onTap: () {
                Navigator.pop(ctx);
                _pick(ImageSource.camera, attachToProductId: productId);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () {
                Navigator.pop(ctx);
                _pick(ImageSource.gallery, attachToProductId: productId);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_pendingPath != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Preview photo')),
        body: Column(
          children: [
            Expanded(child: Image.file(File(_pendingPath!), fit: BoxFit.contain)),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _pendingPath = null),
                      child: const Text('Retake'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _usePhoto,
                      child: Text(_attachProductId != null ? 'Add to product' : 'Use photo'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(onPressed: () => _refresh(q: _search.text.trim()), icon: const Icon(Icons.refresh)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCaptureSheet(),
        icon: const Icon(Icons.add_a_photo),
        label: const Text('Add'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search products',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () => _refresh(q: _search.text.trim()),
                ),
              ),
              onSubmitted: (v) => _refresh(q: v.trim()),
            ),
          ),
          Expanded(
            child: FutureBuilder(
              future: _future,
              builder: (context, snap) {
                if (snap.hasError) return Center(child: Text('${snap.error}'));
                if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                final items = snap.data!;
                if (items.isEmpty) return const Center(child: Text('No products'));
                return ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final p = items[i] as Map;
                    final id = p['id']?.toString();
                    return ListTile(
                      title: Text(p['name']?.toString() ?? 'Product'),
                      subtitle: Text(p['status']?.toString() ?? ''),
                      trailing: PopupMenuButton<String>(
                        onSelected: (v) {
                          if (v == 'ai' && id != null) context.push('/admin/ai?productId=$id');
                          if (v == 'photo' && id != null) _showCaptureSheet(productId: id);
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'ai', child: Text('AI Fashion')),
                          PopupMenuItem(value: 'photo', child: Text('Add photo')),
                        ],
                      ),
                      onTap: id == null ? null : () => context.push('/admin/ai?productId=$id'),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
