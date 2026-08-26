import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminTryOnScreen extends ConsumerStatefulWidget {
  const AdminTryOnScreen({super.key});

  @override
  ConsumerState<AdminTryOnScreen> createState() => _AdminTryOnScreenState();
}

class _AdminTryOnScreenState extends ConsumerState<AdminTryOnScreen> {
  Map<String, dynamic>? _dash;
  List<dynamic> _items = [];
  String _status = 'all';
  bool _loading = true;
  String? _error;
  List<String> _perms = [];
  bool _enabled = true;
  bool _consentRequired = true;
  bool _allowCamera = true;
  bool _allowUpload = true;
  int _retentionHours = 24;
  int _perUserPerHour = 10;
  bool _savingSettings = false;

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
      final me = await repo.me();
      final perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      final dash = await repo.tryOnDashboard();
      final list = await repo.tryOnSessions(status: _status == 'all' ? null : _status);
      Map<String, dynamic>? settings;
      try {
        settings = await repo.tryOnSettings();
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _perms = perms;
        _dash = dash;
        _items = list;
        if (settings != null) {
          _enabled = settings['enabled'] == true;
          _consentRequired = settings['consentRequired'] != false;
          _allowCamera = settings['allowCamera'] != false;
          _allowUpload = settings['allowUpload'] != false;
          _retentionHours = (settings['retentionHours'] as num?)?.toInt() ?? 24;
          _perUserPerHour = (settings['perUserPerHour'] as num?)?.toInt() ?? 10;
        }
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

  Future<void> _saveSettings() async {
    setState(() => _savingSettings = true);
    try {
      await ref.read(adminRepoProvider).updateTryOnSettings({
        'enabled': _enabled,
        'consentRequired': _consentRequired,
        'allowCamera': _allowCamera,
        'allowUpload': _allowUpload,
        'retentionHours': _retentionHours,
        'perUserPerHour': _perUserPerHour,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('TRY ME settings saved')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _savingSettings = false);
    }
  }

  Future<void> _act(String id, String action) async {
    final repo = ref.read(adminRepoProvider);
    try {
      if (action == 'retry') await repo.retryTryOn(id);
      if (action == 'cancel') await repo.cancelTryOn(id);
      if (action == 'delete') await repo.deleteTryOn(id);
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final canManage = adminHasAny(_perms, ['ai.tryon.manage', 'ai_settings.update']);
    final canDelete = adminHasAny(_perms, ['ai.tryon.delete']);
    final counts = (_dash?['counts'] as Map?)?.cast<String, dynamic>() ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('Virtual Try-On'),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh)),
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
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: counts.entries
                            .map(
                              (e) => Chip(
                                label: Text('${e.key}: ${e.value}'),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 16),
                      if (canManage) ...[
                        Text('TRY ME settings', style: Theme.of(context).textTheme.titleMedium),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Enabled'),
                          value: _enabled,
                          onChanged: (v) => setState(() => _enabled = v),
                        ),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Consent UI required'),
                          value: _consentRequired,
                          onChanged: (v) => setState(() => _consentRequired = v),
                        ),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Allow camera'),
                          value: _allowCamera,
                          onChanged: (v) => setState(() => _allowCamera = v),
                        ),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Allow upload'),
                          value: _allowUpload,
                          onChanged: (v) => setState(() => _allowUpload = v),
                        ),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Retention hours'),
                          trailing: SizedBox(
                            width: 72,
                            child: TextFormField(
                              initialValue: '$_retentionHours',
                              keyboardType: TextInputType.number,
                              onChanged: (v) =>
                                  _retentionHours = int.tryParse(v) ?? _retentionHours,
                            ),
                          ),
                        ),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Per user / hour'),
                          trailing: SizedBox(
                            width: 72,
                            child: TextFormField(
                              initialValue: '$_perUserPerHour',
                              keyboardType: TextInputType.number,
                              onChanged: (v) =>
                                  _perUserPerHour = int.tryParse(v) ?? _perUserPerHour,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        FilledButton(
                          onPressed: _savingSettings ? null : _saveSettings,
                          child: Text(_savingSettings ? 'Saving…' : 'Save settings'),
                        ),
                        const SizedBox(height: 24),
                      ],
                      DropdownButtonFormField<String>(
                        initialValue: _status,
                        decoration: const InputDecoration(labelText: 'Filter status'),
                        items: const [
                          DropdownMenuItem(value: 'all', child: Text('All')),
                          DropdownMenuItem(value: 'QUEUED', child: Text('Queued')),
                          DropdownMenuItem(value: 'PROCESSING', child: Text('Processing')),
                          DropdownMenuItem(value: 'COMPLETED', child: Text('Completed')),
                          DropdownMenuItem(value: 'FAILED', child: Text('Failed')),
                          DropdownMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
                          DropdownMenuItem(value: 'EXPIRED', child: Text('Expired')),
                        ],
                        onChanged: (v) {
                          if (v == null) return;
                          setState(() => _status = v);
                          _load();
                        },
                      ),
                      const SizedBox(height: 12),
                      ..._items.map((raw) {
                        final s = Map<String, dynamic>.from(raw as Map);
                        final id = s['id']?.toString() ?? '';
                        final status = s['status']?.toString() ?? '';
                        final product = s['product'];
                        final name = product is Map
                            ? product['name']?.toString() ?? 'Product'
                            : 'Product';
                        return Card(
                          child: ListTile(
                            title: Text(name),
                            subtitle: Text('$status · $id'),
                            isThreeLine: true,
                            trailing: PopupMenuButton<String>(
                              onSelected: (a) => _act(id, a),
                              itemBuilder: (ctx) => [
                                if (canManage && status == 'FAILED')
                                  const PopupMenuItem(value: 'retry', child: Text('Retry')),
                                if (canManage && status == 'QUEUED')
                                  const PopupMenuItem(value: 'cancel', child: Text('Cancel')),
                                if (canDelete)
                                  const PopupMenuItem(value: 'delete', child: Text('Delete')),
                              ],
                            ),
                          ),
                        );
                      }),
                      if (_items.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(24),
                          child: Text('No try-on sessions'),
                        ),
                    ],
                  ),
                ),
    );
  }
}
