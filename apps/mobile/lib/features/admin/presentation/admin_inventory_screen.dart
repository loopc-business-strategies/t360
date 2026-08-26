import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminInventoryScreen extends ConsumerStatefulWidget {
  const AdminInventoryScreen({super.key});

  @override
  ConsumerState<AdminInventoryScreen> createState() => _AdminInventoryScreenState();
}

class _AdminInventoryScreenState extends ConsumerState<AdminInventoryScreen> {
  late Future<List<dynamic>> _future;
  List<String> _perms = [];
  bool _lowOnly = true;
  String? _branchId;
  List<dynamic> _branches = [];
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _future = _load();
    _bootstrap();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final repo = ref.read(adminRepoProvider);
      final me = await repo.me();
      final perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      final branches = await repo.branches();
      if (mounted) {
        setState(() {
          _perms = perms;
          _branches = branches;
        });
      }
    } catch (_) {}
  }

  Future<List<dynamic>> _load() => ref.read(adminRepoProvider).inventory(
        branchId: _branchId,
        lowStockOnly: _lowOnly,
      );

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  Future<void> _adjust(Map row) async {
    final branchId = row['branchId']?.toString() ?? '';
    final variantId = row['variantId']?.toString() ?? '';
    final deltaCtrl = TextEditingController(text: '1');
    final reasonCtrl = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Adjust stock', style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text('Use negative qty to remove stock'),
              TextField(
                controller: deltaCtrl,
                keyboardType: const TextInputType.numberWithOptions(signed: true),
                decoration: const InputDecoration(labelText: 'Qty delta'),
              ),
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(labelText: 'Reason'),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Apply'),
              ),
            ],
          ),
        );
      },
    );
    if (ok != true) return;
    final delta = int.tryParse(deltaCtrl.text.trim());
    if (delta == null || delta == 0) return;
    try {
      await ref.read(adminRepoProvider).adjustInventory(
            branchId: branchId,
            variantId: variantId,
            qtyDelta: delta,
            reason: reasonCtrl.text.trim().isEmpty ? null : reasonCtrl.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stock adjusted')));
        await _refresh();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final canAdjust = adminHasAny(_perms, ['inventory.adjust']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        actions: [
          IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Filter by name or SKU',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                FilterChip(
                  label: Text(_lowOnly ? 'Low stock' : 'All stock'),
                  selected: _lowOnly,
                  onSelected: (v) {
                    setState(() {
                      _lowOnly = v;
                      _future = _load();
                    });
                  },
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    value: _branchId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Branch',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All branches')),
                      ..._branches.map((b) {
                        final m = b as Map;
                        return DropdownMenuItem(
                          value: m['id']?.toString(),
                          child: Text(m['name']?.toString() ?? m['code']?.toString() ?? ''),
                        );
                      }),
                    ],
                    onChanged: (v) {
                      setState(() {
                        _branchId = v;
                        _future = _load();
                      });
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder(
              future: _future,
              builder: (context, snap) {
                if (snap.hasError) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('${snap.error}', textAlign: TextAlign.center),
                        TextButton(onPressed: _refresh, child: const Text('Retry')),
                      ],
                    ),
                  );
                }
                if (!snap.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                final q = _search.text.trim().toLowerCase();
                var items = snap.data!;
                if (q.isNotEmpty) {
                  items = items.where((raw) {
                    final row = raw as Map;
                    final variant = row['variant'] as Map?;
                    final product = variant?['product'] as Map?;
                    final hay =
                        '${product?['name'] ?? ''} ${variant?['sku'] ?? ''} ${row['variantId'] ?? ''}'
                            .toLowerCase();
                    return hay.contains(q);
                  }).toList();
                }
                if (items.isEmpty) {
                  return Center(child: Text(_lowOnly ? 'No low-stock items' : 'No inventory rows'));
                }
                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView.separated(
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final row = items[i] as Map;
                      final variant = row['variant'] as Map?;
                      final branch = row['branch'] as Map?;
                      final product = variant?['product'] as Map?;
                      final title = product?['name']?.toString() ??
                          variant?['sku']?.toString() ??
                          row['variantId']?.toString() ??
                          'Item';
                      return ListTile(
                        title: Text(title),
                        subtitle: Text(
                          'Avail ${row['availableQty'] ?? '?'} · '
                          'On hand ${row['onHandQty'] ?? row['qtyOnHand'] ?? '?'} · '
                          '${branch?['name'] ?? row['branchId'] ?? ''}',
                        ),
                        trailing: canAdjust
                            ? IconButton(
                                icon: const Icon(Icons.tune),
                                onPressed: () => _adjust(row),
                              )
                            : null,
                        onTap: canAdjust ? () => _adjust(row) : null,
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
