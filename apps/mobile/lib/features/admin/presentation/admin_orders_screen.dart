import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';
import 'admin_shell.dart';

const _statusFlow = [
  'Pending',
  'PaymentPending',
  'Confirmed',
  'Processing',
  'Packed',
  'ReadyForPickup',
  'OutForDelivery',
  'Delivered',
  'Cancelled',
];

class AdminOrdersScreen extends ConsumerStatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  ConsumerState<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends ConsumerState<AdminOrdersScreen> {
  late Future<List<dynamic>> _future;
  List<String> _perms = [];
  String? _filter;

  @override
  void initState() {
    super.initState();
    _future = _load();
    _loadPerms();
  }

  Future<List<dynamic>> _load() => ref.read(adminRepoProvider).orders();

  Future<void> _loadPerms() async {
    try {
      final me = await ref.read(adminRepoProvider).me();
      final list = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      if (mounted) setState(() => _perms = list);
    } catch (_) {}
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final canUpdate = adminHasAny(_perms, ['orders.update']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders'),
        actions: [
          IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                FilterChip(
                  label: const Text('All'),
                  selected: _filter == null,
                  onSelected: (_) => setState(() => _filter = null),
                ),
                const SizedBox(width: 8),
                ...['Pending', 'Confirmed', 'Processing', 'Packed', 'ReadyForPickup', 'Delivered', 'Cancelled']
                    .map(
                  (s) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(s),
                      selected: _filter == s,
                      onSelected: (_) => setState(() => _filter = s),
                    ),
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
                  return _ErrorRetry(message: '${snap.error}', onRetry: _refresh);
                }
                if (!snap.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                var items = snap.data!;
                if (_filter != null) {
                  items = items
                      .where((o) => (o as Map)['status']?.toString() == _filter)
                      .toList();
                }
                if (items.isEmpty) {
                  return const Center(child: Text('No orders'));
                }
                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView.separated(
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final o = items[i] as Map<String, dynamic>;
                      final id = o['id']?.toString() ?? '';
                      final number = o['number']?.toString() ?? id.substring(0, id.length.clamp(0, 8));
                      final customer = o['customer'] as Map?;
                      return ListTile(
                        title: Text('#$number'),
                        subtitle: Text(
                          '${o['status'] ?? ''} · ${customer?['name'] ?? customer?['email'] ?? ''}',
                        ),
                        trailing: Text('₹${o['total'] ?? o['grandTotal'] ?? ''}'),
                        onTap: () => context.push('/admin/orders/$id').then((_) => _refresh()),
                      );
                    },
                  ),
                );
              },
            ),
          ),
          if (!canUpdate && _perms.isNotEmpty)
            const SafeArea(
              child: Padding(
                padding: EdgeInsets.all(8),
                child: Text('Read-only — missing orders.update', textAlign: TextAlign.center),
              ),
            ),
        ],
      ),
    );
  }
}

class AdminOrderDetailScreen extends ConsumerStatefulWidget {
  const AdminOrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  ConsumerState<AdminOrderDetailScreen> createState() => _AdminOrderDetailScreenState();
}

class _AdminOrderDetailScreenState extends ConsumerState<AdminOrderDetailScreen> {
  late Future<Map<String, dynamic>> _future;
  List<String> _perms = [];
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = ref.read(adminRepoProvider).order(widget.orderId);
    _loadPerms();
  }

  Future<void> _loadPerms() async {
    try {
      final me = await ref.read(adminRepoProvider).me();
      final list = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      if (mounted) setState(() => _perms = list);
    } catch (_) {}
  }

  Future<void> _refresh() async {
    setState(() => _future = ref.read(adminRepoProvider).order(widget.orderId));
    await _future;
  }

  Future<void> _setStatus(String status) async {
    setState(() => _busy = true);
    try {
      await ref.read(adminRepoProvider).updateOrderStatus(widget.orderId, status);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Status → $status')));
        await _refresh();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyPickup() async {
    final code = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Verify pickup'),
        content: TextField(
          controller: code,
          decoration: const InputDecoration(labelText: 'Pickup code'),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Verify')),
        ],
      ),
    );
    if (ok != true || code.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(adminRepoProvider).verifyPickup(widget.orderId, code.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pickup verified')));
        await _refresh();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canUpdate = adminHasAny(_perms, ['orders.update']);
    final canCancel = adminHasAny(_perms, ['orders.cancel', 'orders.update']);

    return Scaffold(
      appBar: AppBar(title: const Text('Order detail')),
      body: FutureBuilder(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) {
            return _ErrorRetry(message: '${snap.error}', onRetry: _refresh);
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final o = snap.data!;
          final items = (o['items'] as List?) ?? const [];
          final events = (o['events'] as List?) ?? const [];
          final customer = o['customer'] as Map?;
          final status = o['status']?.toString() ?? '';

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('#${o['number'] ?? o['id']}', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text('Status: $status'),
              Text('Total: ₹${o['total'] ?? ''}'),
              Text('Fulfillment: ${o['fulfillmentType'] ?? o['channel'] ?? '—'}'),
              if (customer != null) ...[
                const SizedBox(height: 12),
                Text('Customer', style: Theme.of(context).textTheme.titleMedium),
                Text('${customer['name'] ?? ''}'),
                Text('${customer['email'] ?? customer['mobile'] ?? ''}'),
              ],
              const SizedBox(height: 16),
              Text('Items', style: Theme.of(context).textTheme.titleMedium),
              ...items.map((raw) {
                final it = raw as Map;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text('${it['name'] ?? it['sku']}'),
                  subtitle: Text('Qty ${it['qty']} · ₹${it['lineTotal'] ?? it['unitPrice']}'),
                );
              }),
              if (events.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Timeline', style: Theme.of(context).textTheme.titleMedium),
                ...events.map((raw) {
                  final e = raw as Map;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text('${e['toStatus'] ?? e['status'] ?? e['action'] ?? ''}'),
                    subtitle: Text('${e['note'] ?? e['createdAt'] ?? ''}'),
                  );
                }),
              ],
              if (_busy) const LinearProgressIndicator(),
              if (canUpdate) ...[
                const SizedBox(height: 16),
                Text('Update status', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _statusFlow
                      .where((s) => s != status)
                      .where((s) => s != 'Cancelled' || canCancel)
                      .map(
                        (s) => OutlinedButton(
                          onPressed: _busy ? null : () => _setStatus(s),
                          child: Text(s),
                        ),
                      )
                      .toList(),
                ),
                if (status == 'ReadyForPickup') ...[
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _busy ? null : _verifyPickup,
                    icon: const Icon(Icons.qr_code),
                    label: const Text('Verify pickup code'),
                  ),
                ],
              ],
            ],
          );
        },
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  const _ErrorRetry({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
