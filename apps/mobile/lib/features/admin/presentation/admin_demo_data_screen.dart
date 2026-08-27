import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminDemoDataScreen extends ConsumerStatefulWidget {
  const AdminDemoDataScreen({super.key});

  @override
  ConsumerState<AdminDemoDataScreen> createState() => _AdminDemoDataScreenState();
}

class _AdminDemoDataScreenState extends ConsumerState<AdminDemoDataScreen> {
  bool _loading = true;
  bool _busy = false;
  String? _error;
  String? _message;
  Map<String, dynamic>? _status;

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
      final status = await ref.read(adminRepoProvider).getDemoDataStatus();
      if (!mounted) return;
      setState(() {
        _status = status;
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

  Future<void> _run(Future<Map<String, dynamic>> Function() action, String okMessage) async {
    setState(() {
      _busy = true;
      _error = null;
      _message = null;
    });
    try {
      final result = await action();
      if (!mounted) return;
      setState(() {
        _message = okMessage;
        if (result.containsKey('products') || result.containsKey('removedProducts')) {
          // Refresh status after mutation
        }
        _busy = false;
      });
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _busy = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '$e';
          _busy = false;
        });
      }
    }
  }

  Future<bool> _confirm(String title, String body) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirm')),
        ],
      ),
    );
    return ok == true;
  }

  Widget _stat(String label, Object? value) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 4),
            Text('${value ?? '—'}', style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = _status;
    final products = s?['products'] as int? ?? 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Demo catalog')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    'Batch ${s?['batchId'] ?? 'T360_DEMO_001'}. Seed/remove only affects demo-tagged rows.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.6,
                    children: [
                      _stat('Products', s?['products']),
                      _stat('Categories', s?['categories']),
                      _stat('Collections', s?['collections']),
                      _stat('Images', s?['images']),
                      _stat('Videos', s?['videos']),
                      _stat('TRY ME', s?['tryMe']),
                    ],
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _busy
                        ? null
                        : () => _run(
                              () => ref.read(adminRepoProvider).seedDemoData(),
                              'Demo catalog seeded.',
                            ),
                    child: Text(_busy ? 'Working…' : 'Seed demo catalog'),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: _busy || products == 0
                        ? null
                        : () async {
                            final ok = await _confirm(
                              'Remove demo data?',
                              'Deletes T360_DEMO_001 products and demo-only categories/collections. Real orders are untouched.',
                            );
                            if (!ok || !mounted) return;
                            await _run(
                              () => ref.read(adminRepoProvider).removeDemoData(),
                              'Demo catalog removed.',
                            );
                          },
                    child: const Text('Remove demo data'),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: _busy
                        ? null
                        : () async {
                            final ok = await _confirm(
                              'Reset demo catalog?',
                              'Removes the current demo batch and re-seeds 120 products. May take a few minutes.',
                            );
                            if (!ok || !mounted) return;
                            await _run(
                              () => ref.read(adminRepoProvider).resetDemoData(),
                              'Demo catalog reset.',
                            );
                          },
                    child: const Text('Reset (remove + seed)'),
                  ),
                  if (_message != null) ...[
                    const SizedBox(height: 12),
                    Text(_message!, style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ],
                ],
              ),
            ),
    );
  }
}
