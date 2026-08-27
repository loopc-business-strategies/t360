import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminReviewsScreen extends ConsumerStatefulWidget {
  const AdminReviewsScreen({super.key});

  @override
  ConsumerState<AdminReviewsScreen> createState() => _AdminReviewsScreenState();
}

class _AdminReviewsScreenState extends ConsumerState<AdminReviewsScreen> {
  bool _loading = true;
  bool _busy = false;
  String? _error;
  String _status = 'pending';
  List<Map<String, dynamic>> _items = [];
  int _total = 0;

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
      final data = await ref.read(adminRepoProvider).listReviews(status: _status);
      final items = (data['items'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      final meta = data['meta'] is Map ? Map<String, dynamic>.from(data['meta'] as Map) : {};
      if (!mounted) return;
      setState(() {
        _items = items;
        _total = (meta['total'] as num?)?.toInt() ?? items.length;
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

  Future<void> _moderate(String id, String next) async {
    setState(() => _busy = true);
    try {
      await ref.read(adminRepoProvider).moderateReview(id, next);
      await _load();
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reviews'),
        actions: [IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh))],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'pending', child: Text('Pending')),
                DropdownMenuItem(value: 'approved', child: Text('Approved')),
                DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                DropdownMenuItem(value: '', child: Text('All')),
              ],
              onChanged: (v) {
                setState(() => _status = v ?? 'pending');
                _load();
              },
            ),
          ),
          Expanded(
            child: _loading
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
                    : _items.isEmpty
                        ? const Center(child: Text('No reviews'))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _items.length + 1,
                            itemBuilder: (context, i) {
                              if (i == _items.length) {
                                return Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text('$_total total reviews'),
                                );
                              }
                              final r = _items[i];
                              final product = r['product'] is Map
                                  ? Map<String, dynamic>.from(r['product'] as Map)
                                  : <String, dynamic>{};
                              final customer = r['customer'] is Map
                                  ? Map<String, dynamic>.from(r['customer'] as Map)
                                  : <String, dynamic>{};
                              final pending = r['status'] == 'pending';
                              return Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${product['name'] ?? 'Product'}',
                                        style: Theme.of(context).textTheme.titleSmall,
                                      ),
                                      Text(
                                        '${customer['name'] ?? 'Customer'} · ${r['rating'] ?? '—'}★ · ${r['status']}',
                                      ),
                                      if ((r['title'] ?? '').toString().isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 6),
                                          child: Text(
                                            '${r['title']}',
                                            style: const TextStyle(fontWeight: FontWeight.w600),
                                          ),
                                        ),
                                      if ((r['body'] ?? '').toString().isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: Text('${r['body']}'),
                                        ),
                                      if (pending) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            FilledButton(
                                              onPressed: _busy
                                                  ? null
                                                  : () => _moderate('${r['id']}', 'approved'),
                                              child: const Text('Approve'),
                                            ),
                                            const SizedBox(width: 8),
                                            OutlinedButton(
                                              onPressed: _busy
                                                  ? null
                                                  : () => _moderate('${r['id']}', 'rejected'),
                                              child: const Text('Reject'),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
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
