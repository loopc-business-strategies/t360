import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminSettingsScreen extends ConsumerStatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  ConsumerState<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends ConsumerState<AdminSettingsScreen> {
  List<dynamic> _settings = [];
  Map<String, dynamic>? _ai;
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
      final settings = await repo.settings();
      Map<String, dynamic>? ai;
      try {
        ai = await repo.aiSettings();
      } catch (_) {}
      if (mounted) {
        setState(() {
          _settings = settings;
          _ai = ai;
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

  String _mask(dynamic value) {
    final s = value?.toString() ?? '';
    if (s.isEmpty) return '—';
    if (s.length <= 8) return '••••';
    return '${s.substring(0, 4)}…••••';
  }

  @override
  Widget build(BuildContext context) {
    final interesting = _settings.where((raw) {
      final key = (raw as Map)['key']?.toString() ?? '';
      return key.startsWith('business.') ||
          key.startsWith('feature.') ||
          key.startsWith('payment.') ||
          key.startsWith('ai.') ||
          key.contains('provider');
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
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
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text('System', style: Theme.of(context).textTheme.titleMedium),
                    const Text(
                      'Secrets are never shown in full. Values that look like keys are masked.',
                      style: TextStyle(color: Colors.black54),
                    ),
                    const SizedBox(height: 8),
                    ...interesting.map((raw) {
                      final m = raw as Map;
                      final key = m['key']?.toString() ?? '';
                      final val = m['value'];
                      final sensitive = key.toLowerCase().contains('key') ||
                          key.toLowerCase().contains('secret') ||
                          key.toLowerCase().contains('token');
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(key),
                        subtitle: Text(sensitive ? _mask(val) : '$val'),
                      );
                    }),
                    if (_ai != null) ...[
                      const Divider(),
                      Text('AI Fashion (no secrets)', style: Theme.of(context).textTheme.titleMedium),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Enabled'),
                        trailing: Text('${_ai!['enabled'] ?? _ai!['config']?['enabled'] ?? '—'}'),
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Daily limit'),
                        trailing: Text('${_ai!['config']?['dailyLimit'] ?? _ai!['dailyLimit'] ?? '—'}'),
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Monthly limit'),
                        trailing: Text('${_ai!['config']?['monthlyLimit'] ?? _ai!['monthlyLimit'] ?? '—'}'),
                      ),
                    ],
                    const Divider(),
                    const ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Payments'),
                      subtitle: Text(
                        'Razorpay keys live only on the API. Mobile never stores payment secrets.',
                      ),
                    ),
                  ],
                ),
    );
  }
}
