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

  @override
  void initState() {
    super.initState();
    _future = ref.read(adminRepoProvider).products();
  }

  Future<void> _refresh() async {
    setState(() => _future = ref.read(adminRepoProvider).products());
  }

  Future<void> _createWithCamera() async {
    final picker = ImagePicker();
    final shot = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (shot == null) return;
    final repo = ref.read(adminRepoProvider);
    try {
      final upload = await repo.uploadImage(shot.path);
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
        'imageUrls': [upload['url']],
        'generateAiFashion': false,
        'variants': [
          {'sku': sku, 'price': 999, 'attributes': {'size': 'M', 'colour': 'Blue'}},
        ],
      });
      if (mounted) {
        context.push('/admin/ai?productId=${product['id']}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createWithCamera,
        icon: const Icon(Icons.photo_camera),
        label: const Text('Capture'),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) {
            return Center(child: Text('${snap.error}'));
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data!;
          if (items.isEmpty) {
            return const Center(child: Text('No products'));
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final p = items[i] as Map<String, dynamic>;
                return ListTile(
                  title: Text(p['name']?.toString() ?? 'Product'),
                  subtitle: Text(p['status']?.toString() ?? ''),
                  onTap: () => context.push('/admin/ai?productId=${p['id']}'),
                  trailing: const Icon(Icons.auto_awesome),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
