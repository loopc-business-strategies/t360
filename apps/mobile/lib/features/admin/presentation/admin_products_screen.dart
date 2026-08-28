import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/api_exception.dart';
import '../../auth/presentation/auth_screen.dart';
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
  bool _showCreateForm = false;
  String? _uploadedUrl;
  bool _submitting = false;
  bool _generateAiFashion = true;
  String? _aiSettingsSummary;
  bool? _aiConfigured;

  final _name = TextEditingController();
  final _sku = TextEditingController();
  final _price = TextEditingController(text: '999');
  final _size = TextEditingController(text: 'M');
  final _colour = TextEditingController(text: 'Blue');
  final _stock = TextEditingController();
  String? _categoryId;
  String? _brandId;
  List<dynamic> _categories = [];
  List<dynamic> _brands = [];

  @override
  void initState() {
    super.initState();
    _future = ref.read(adminRepoProvider).products();
    _sku.text = 'MOB-${DateTime.now().millisecondsSinceEpoch}';
  }

  @override
  void dispose() {
    _search.dispose();
    _name.dispose();
    _sku.dispose();
    _price.dispose();
    _size.dispose();
    _colour.dispose();
    _stock.dispose();
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
      _showCreateForm = false;
      _uploadedUrl = null;
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
          context.push('/admin/ai?productId=$_attachProductId&autoStart=1');
        }
        return;
      }

      final cats = await repo.categories();
      List<dynamic> brands = [];
      try {
        brands = await repo.brands();
      } catch (_) {}

      Map<String, dynamic>? aiSettings;
      try {
        aiSettings = await repo.aiSettings();
      } catch (_) {}

      if (!mounted) return;
      setState(() {
        _uploadedUrl = url;
        _categories = cats;
        _brands = brands;
        _categoryId = cats.isNotEmpty ? (cats.first as Map)['id']?.toString() : null;
        _brandId = null;
        _name.text = '';
        _sku.text = 'MOB-${DateTime.now().millisecondsSinceEpoch}';
        _showCreateForm = true;
        _pendingPath = null;
        _aiConfigured = aiSettings?['apiKeyConfigured'] == true && aiSettings?['enabled'] == true;
        if (aiSettings != null) {
          final mode = aiSettings['defaultGenerationMode']?.toString() ?? 'fast';
          final resolution = aiSettings['defaultResolution']?.toString() ?? '1k';
          final count = (aiSettings['defaultNumImages'] as num?)?.toInt() ?? 1;
          _aiSettingsSummary = 'Defaults: studio background, standing pose · $count image(s) · $resolution · $mode';
        } else {
          _aiSettingsSummary = 'Defaults: studio background, standing pose · 1 image · 1k · fast';
        }
      });
    } catch (e) {
      if (mounted) {
        final msg = e is ApiException ? e.message : mapAuthError(e);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    }
  }

  Future<void> _submitProduct() async {
    final url = _uploadedUrl;
    final categoryId = _categoryId;
    if (url == null || categoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Category and image are required')),
      );
      return;
    }
    final name = _name.text.trim();
    final sku = _sku.text.trim();
    final price = double.tryParse(_price.text.trim());
    if (name.isEmpty || sku.isEmpty || price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name, SKU, and valid price are required')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final product = await ref.read(adminRepoProvider).createProduct({
        'name': name,
        'categoryId': categoryId,
        if (_brandId != null) 'brandId': _brandId,
        'status': 'draft',
        'imageUrls': [url],
        'generateAiFashion': _generateAiFashion,
        'variants': [
          {
            'sku': sku,
            'price': price,
            'attributes': {
              if (_size.text.trim().isNotEmpty) 'size': _size.text.trim(),
              if (_colour.text.trim().isNotEmpty) 'colour': _colour.text.trim(),
            },
          },
        ],
      });
      // Stock requires branch + inventory.adjust; create API has no stock on variant.
      final stockNote = _stock.text.trim().isNotEmpty
          ? ' Set stock in Inventory on web/mobile after create.'
          : '';
      if (mounted) {
        setState(() {
          _showCreateForm = false;
          _uploadedUrl = null;
          _submitting = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Product created.$stockNote')),
        );
        context.push('/admin/ai?productId=${product['id']}&autoStart=1');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        final msg = e is ApiException ? e.message : mapAuthError(e);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
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

    if (_showCreateForm && _uploadedUrl != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('New product'),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => setState(() {
              _showCreateForm = false;
              _uploadedUrl = null;
            }),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Image.network(_uploadedUrl!, fit: BoxFit.cover),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Name *'),
            ),
            TextField(
              controller: _sku,
              decoration: const InputDecoration(labelText: 'SKU *'),
            ),
            DropdownButtonFormField<String>(
              key: ValueKey('cat-$_categoryId'),
              initialValue: _categoryId,
              decoration: const InputDecoration(labelText: 'Category *'),
              items: _categories.map((c) {
                final m = c as Map;
                return DropdownMenuItem(
                  value: m['id']?.toString(),
                  child: Text(m['name']?.toString() ?? 'Category'),
                );
              }).toList(),
              onChanged: (v) => setState(() => _categoryId = v),
            ),
            if (_brands.isNotEmpty)
              DropdownButtonFormField<String?>(
                key: ValueKey('brand-$_brandId'),
                initialValue: _brandId,
                decoration: const InputDecoration(labelText: 'Brand (optional)'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('None')),
                  ..._brands.map((b) {
                    final m = b as Map;
                    return DropdownMenuItem(
                      value: m['id']?.toString(),
                      child: Text(m['name']?.toString() ?? 'Brand'),
                    );
                  }),
                ],
                onChanged: (v) => setState(() => _brandId = v),
              ),
            TextField(
              controller: _price,
              decoration: const InputDecoration(labelText: 'Price *'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            TextField(
              controller: _size,
              decoration: const InputDecoration(labelText: 'Size'),
            ),
            TextField(
              controller: _colour,
              decoration: const InputDecoration(labelText: 'Colour'),
            ),
            TextField(
              controller: _stock,
              decoration: const InputDecoration(
                labelText: 'Stock (set via Inventory after create)',
                helperText: 'Create API does not accept initial stock on variants',
              ),
              keyboardType: TextInputType.number,
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Auto-generate model images'),
              subtitle: _generateAiFashion
                  ? const Text('AI will generate model + studio background images after create')
                  : const Text('Create product only; generate AI images manually later'),
              value: _generateAiFashion,
              onChanged: (v) => setState(() => _generateAiFashion = v),
            ),
            if (_generateAiFashion) ...[
              if (_aiConfigured == false)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    'AI Fashion is not configured. Enable it in AI Settings and set FASHN_API_KEY on the server.',
                    style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 13),
                  ),
                ),
              if (_aiSettingsSummary != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    _aiSettingsSummary!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _submitProduct,
              child: Text(
                _submitting
                    ? 'Creating…'
                    : (_generateAiFashion ? 'Create & generate AI images' : 'Create product'),
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
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final p = items[i] as Map;
                    final id = p['id']?.toString();
                    return ListTile(
                      title: Text(p['name']?.toString() ?? 'Product'),
                      subtitle: Text(p['status']?.toString() ?? ''),
                      trailing: PopupMenuButton<String>(
                        onSelected: (v) {
                          if (v == 'edit' && id != null) context.push('/admin/products/$id');
                          if (v == 'ai' && id != null) context.push('/admin/ai?productId=$id');
                          if (v == 'photo' && id != null) _showCaptureSheet(productId: id);
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit')),
                          PopupMenuItem(value: 'ai', child: Text('AI Fashion')),
                          PopupMenuItem(value: 'photo', child: Text('Add photo')),
                        ],
                      ),
                      onTap: id == null ? null : () => context.push('/admin/products/$id'),
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
