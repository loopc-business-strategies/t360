import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminCollectionsScreen extends ConsumerStatefulWidget {
  const AdminCollectionsScreen({super.key});

  @override
  ConsumerState<AdminCollectionsScreen> createState() => _AdminCollectionsScreenState();
}

class _AdminCollectionsScreenState extends ConsumerState<AdminCollectionsScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _items = [];

  final _name = TextEditingController();
  final _description = TextEditingController();
  final _productIds = TextEditingController();
  final _productSearch = TextEditingController();

  Map<String, dynamic>? _editing;
  List<Map<String, dynamic>> _productHits = [];
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _productIds.dispose();
    _productSearch.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await ref.read(adminRepoProvider).listCollections();
      if (!mounted) return;
      setState(() {
        _items = rows.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '$e';
          _loading = false;
        });
      }
    }
  }

  Future<void> _create() async {
    final name = _name.text.trim();
    if (name.isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref.read(adminRepoProvider).createCollection({
        'name': name,
        if (_description.text.trim().isNotEmpty) 'description': _description.text.trim(),
      });
      _name.clear();
      _description.clear();
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _searchProducts(String q) async {
    if (q.trim().isEmpty) {
      setState(() => _productHits = []);
      return;
    }
    try {
      final rows = await ref.read(adminRepoProvider).products(q: q.trim());
      if (!mounted) return;
      setState(() {
        _productHits = rows.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      });
    } catch (_) {
      if (mounted) setState(() => _productHits = []);
    }
  }

  Future<void> _saveProducts() async {
    final editing = _editing;
    if (editing == null) return;
    final ids = _productIds.text
        .split(RegExp(r'[\s,]+'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    setState(() => _saving = true);
    try {
      await ref.read(adminRepoProvider).setCollectionProducts('${editing['id']}', ids);
      if (mounted) {
        setState(() {
          _editing = null;
          _productIds.clear();
          _productHits = [];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Products updated')),
        );
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Collections'),
        actions: [IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh))],
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
                      decoration: const InputDecoration(labelText: 'Name'),
                    ),
                    TextField(
                      controller: _description,
                      decoration: const InputDecoration(labelText: 'Description'),
                    ),
                    const SizedBox(height: 8),
                    FilledButton(
                      onPressed: _saving ? null : _create,
                      child: Text(_saving ? 'Saving…' : 'Add collection'),
                    ),
                    const SizedBox(height: 20),
                    if (_items.isEmpty) const Text('No collections'),
                    for (final c in _items)
                      Card(
                        child: ListTile(
                          title: Text('${c['name'] ?? ''}'),
                          subtitle: Text(
                            '${c['slug'] ?? ''} · ${c['status'] ?? ''} · '
                            '${(c['_count'] is Map ? (c['_count'] as Map)['products'] : 0) ?? 0} products',
                          ),
                          trailing: TextButton(
                            onPressed: () {
                              setState(() {
                                _editing = c;
                                _productIds.clear();
                                _productHits = [];
                              });
                            },
                            child: const Text('Assign'),
                          ),
                        ),
                      ),
                    if (_editing != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Products in ${_editing!['name']}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      TextField(
                        controller: _productIds,
                        decoration: const InputDecoration(
                          labelText: 'Product IDs (comma-separated)',
                        ),
                      ),
                      TextField(
                        controller: _productSearch,
                        decoration: const InputDecoration(labelText: 'Search products'),
                        onChanged: _searchProducts,
                      ),
                      for (final p in _productHits)
                        ListTile(
                          dense: true,
                          title: Text('${p['name'] ?? ''}'),
                          subtitle: Text('${p['slug'] ?? ''}'),
                          onTap: () {
                            final id = '${p['id']}';
                            final current = _productIds.text.trim();
                            setState(() {
                              _productIds.text = current.isEmpty ? id : '$current, $id';
                            });
                          },
                        ),
                      Row(
                        children: [
                          FilledButton(
                            onPressed: _saving ? null : _saveProducts,
                            child: const Text('Save products'),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () => setState(() => _editing = null),
                            child: const Text('Cancel'),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
    );
  }
}
