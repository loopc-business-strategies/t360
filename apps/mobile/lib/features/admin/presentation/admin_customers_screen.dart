import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminCustomersScreen extends ConsumerStatefulWidget {
  const AdminCustomersScreen({super.key});

  @override
  ConsumerState<AdminCustomersScreen> createState() => _AdminCustomersScreenState();
}

class _AdminCustomersScreenState extends ConsumerState<AdminCustomersScreen> {
  final _search = TextEditingController();
  late Future<List<dynamic>> _future;
  List<String> _perms = [];
  Map<String, dynamic>? _selected;
  final _loyaltyDelta = TextEditingController(text: '10');
  final _loyaltyReason = TextEditingController(text: 'Manual adjustment');

  @override
  void initState() {
    super.initState();
    _future = _load();
    _loadPerms();
  }

  @override
  void dispose() {
    _search.dispose();
    _loyaltyDelta.dispose();
    _loyaltyReason.dispose();
    super.dispose();
  }

  Future<List<dynamic>> _load() =>
      ref.read(adminRepoProvider).customers(q: _search.text.trim());

  Future<void> _loadPerms() async {
    try {
      final me = await ref.read(adminRepoProvider).me();
      final list = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      if (mounted) setState(() => _perms = list);
    } catch (_) {}
  }

  Future<void> _open(String id) async {
    try {
      final c = await ref.read(adminRepoProvider).customer(id);
      if (mounted) setState(() => _selected = c);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  Future<void> _adjustLoyalty(String customerId) async {
    if (!adminHasAny(_perms, ['loyalty.manage'])) return;
    final delta = int.tryParse(_loyaltyDelta.text.trim());
    if (delta == null || delta == 0) return;
    try {
      await ref.read(adminRepoProvider).adjustLoyalty(
            customerId,
            delta: delta,
            reason: _loyaltyReason.text.trim().isEmpty ? 'Manual' : _loyaltyReason.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Loyalty adjusted')));
        await _open(customerId);
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final canLoyalty = adminHasAny(_perms, ['loyalty.manage']);

    if (_selected != null) {
      final c = _selected!;
      final user = c['user'] as Map?;
      final loyalty = c['loyaltyAccount'] as Map?;
      final orders = (c['orders'] as List?) ?? const [];
      final id = c['id']?.toString() ?? '';
      return Scaffold(
        appBar: AppBar(
          title: Text(c['name']?.toString() ?? 'Customer'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => setState(() => _selected = null),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('${user?['mobile'] ?? ''} · ${user?['email'] ?? ''}'),
            Text('Orders: ${c['orderSummary']?['count'] ?? orders.length}'),
            Text('Revenue: ₹${c['orderSummary']?['revenue'] ?? '—'}'),
            Text('Loyalty: ${loyalty?['pointsBalance'] ?? '—'} pts'),
            const SizedBox(height: 16),
            Text('Recent orders', style: Theme.of(context).textTheme.titleMedium),
            ...orders.take(10).map((raw) {
              final o = raw as Map;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('#${o['number'] ?? o['id']}'),
                subtitle: Text('${o['status']}'),
                trailing: Text('₹${o['total']}'),
              );
            }),
            if (canLoyalty && id.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Adjust loyalty', style: Theme.of(context).textTheme.titleMedium),
              TextField(
                controller: _loyaltyDelta,
                keyboardType: const TextInputType.numberWithOptions(signed: true),
                decoration: const InputDecoration(labelText: 'Delta (+/-)'),
              ),
              TextField(
                controller: _loyaltyReason,
                decoration: const InputDecoration(labelText: 'Reason'),
              ),
              FilledButton(
                onPressed: () => _adjustLoyalty(id),
                child: const Text('Apply'),
              ),
            ],
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Customers')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search name, mobile, email',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () => setState(() => _future = _load()),
                ),
              ),
              onSubmitted: (_) => setState(() => _future = _load()),
            ),
          ),
          Expanded(
            child: FutureBuilder(
              future: _future,
              builder: (context, snap) {
                if (snap.hasError) {
                  return Center(child: Text('${snap.error}'));
                }
                if (!snap.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                final items = snap.data!;
                if (items.isEmpty) return const Center(child: Text('No customers'));
                return ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final c = items[i] as Map;
                    final user = c['user'] as Map?;
                    final id = c['id']?.toString();
                    return ListTile(
                      title: Text(c['name']?.toString() ?? user?['mobile']?.toString() ?? 'Customer'),
                      subtitle: Text('${user?['email'] ?? user?['mobile'] ?? ''}'),
                      trailing: Text('${(c['_count'] as Map?)?['orders'] ?? ''} orders'),
                      onTap: id == null ? null : () => _open(id),
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
