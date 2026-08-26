import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminPosScreen extends ConsumerStatefulWidget {
  const AdminPosScreen({super.key});

  @override
  ConsumerState<AdminPosScreen> createState() => _AdminPosScreenState();
}

class _AdminPosScreenState extends ConsumerState<AdminPosScreen> {
  Map<String, dynamic>? _status;
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final data = await ref.read(adminRepoProvider).posStatus();
      if (mounted) setState(() => _status = data);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sync() async {
    setState(() => _busy = true);
    try {
      await ref.read(adminRepoProvider).posSync();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Inventory sync requested')),
        );
        await _load();
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
    final provider = _status?['provider']?.toString() ??
        _status?['type']?.toString() ??
        'unknown';
    final isMock = provider.toLowerCase().contains('mock') ||
        (_status?['status']?.toString().toLowerCase() == 'mock');

    return Scaffold(
      appBar: AppBar(title: const Text('POS integration')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_busy) const LinearProgressIndicator(),
          if (_error != null) ...[
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            TextButton(onPressed: _load, child: const Text('Retry')),
          ],
          Text('Provider: $provider'),
          Text('Status: ${_status?['status'] ?? '—'}'),
          Text('Last sync: ${_status?['lastSyncAt'] ?? _status?['updatedAt'] ?? '—'}'),
          if (isMock)
            Card(
              color: Colors.amber.shade50,
              child: const ListTile(
                leading: Icon(Icons.info_outline),
                title: Text('Mock POS'),
                subtitle: Text(
                  'This environment uses the mock POS adapter — not a live store POS. '
                  'Sync/import only; do not treat as live sales.',
                ),
              ),
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _sync,
            child: const Text('Sync inventory now'),
          ),
        ],
      ),
    );
  }
}
