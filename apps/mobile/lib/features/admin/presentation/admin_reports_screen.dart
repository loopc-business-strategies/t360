import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminReportsScreen extends ConsumerStatefulWidget {
  const AdminReportsScreen({super.key});

  @override
  ConsumerState<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends ConsumerState<AdminReportsScreen> {
  Map<String, dynamic>? _dashboard;
  Map<String, dynamic>? _sales;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(adminRepoProvider);
      final dash = await repo.dashboard();
      final sales = await repo.salesReport();
      if (mounted) {
        setState(() {
          _dashboard = dash;
          _sales = sales;
          _loading = false;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
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
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text('Overview', style: Theme.of(context).textTheme.titleLarge),
                      ListTile(
                        title: const Text('Orders today'),
                        trailing: Text('${_dashboard?['ordersToday'] ?? '—'}'),
                      ),
                      ListTile(
                        title: const Text('Orders (7d)'),
                        trailing: Text('${_dashboard?['ordersWeek'] ?? '—'}'),
                      ),
                      ListTile(
                        title: const Text('Revenue (7d)'),
                        trailing: Text('₹${_dashboard?['revenueWeek'] ?? '—'}'),
                      ),
                      ListTile(
                        title: const Text('Low stock'),
                        trailing: Text('${_dashboard?['lowStockCount'] ?? '—'}'),
                      ),
                      const Divider(),
                      Text('Sales by day', style: Theme.of(context).textTheme.titleMedium),
                      ...(((_sales?['daily'] as List?) ?? const []).map((raw) {
                        final d = raw as Map;
                        return ListTile(
                          dense: true,
                          title: Text('${d['date']}'),
                          trailing: Text('₹${d['total']}'),
                        );
                      })),
                      const Divider(),
                      Text('Top products', style: Theme.of(context).textTheme.titleMedium),
                      ...(((_sales?['topProducts'] as List?) ?? const []).map((raw) {
                        final p = raw as Map;
                        return ListTile(
                          dense: true,
                          title: Text('${p['name'] ?? p['sku']}'),
                          subtitle: Text('Qty ${p['qty']}'),
                          trailing: Text('₹${p['revenue']}'),
                        );
                      })),
                    ],
                  ),
                ),
    );
  }
}
