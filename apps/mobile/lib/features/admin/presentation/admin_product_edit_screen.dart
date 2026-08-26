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
  bool _loading = true;
  bool _saving = false;
  String? _error;
  List<String> _perms = [];
  List<String> _imageUrls = [];
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
      final images = (p['images'] as List?) ?? [];
      if (!mounted) return;
      setState(() {
        _perms = perms;
        _product = p;
        _name.text = p['name']?.toString() ?? '';
        _description.text = p['description']?.toString() ?? '';
        _status = p['status']?.toString() ?? 'draft';
        _tryOnEnabled = p['tryOnEnabled'] == true;
        _imageUrls = images
            .map((i) => (i as Map)['url']?.toString())
            .whereType<String>()
            .toList();
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

  Future<void> _save({String? statusOverride}) async {
    if (!adminHasAny(_perms, ['products.update'])) return;
    setState(() => _saving = true);
    try {
      await ref.read(adminRepoProvider).updateProduct(widget.productId, {
        'name': _name.text.trim(),
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'status': statusOverride ?? _status,
        'tryOnEnabled': _tryOnEnabled,
        'imageUrls': _imageUrls,
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
    final shot = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (shot == null) return;
    setState(() => _saving = true);
    try {
      final upload = await ref.read(adminRepoProvider).uploadImage(shot.path);
      final url = upload['url']?.toString();
      if (url == null) throw Exception('Upload returned no URL');
      setState(() => _imageUrls = [..._imageUrls, url]);
      await _save();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
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
                    SizedBox(
                      height: 88,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          ..._imageUrls.map(
                            (u) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: Image.network(u, width: 88, height: 88, fit: BoxFit.cover),
                            ),
                          ),
                          if (canUpdate)
                            OutlinedButton.icon(
                              onPressed: _saving ? null : _addImage,
                              icon: const Icon(Icons.add_a_photo),
                              label: const Text('Add'),
                            ),
                        ],
                      ),
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
