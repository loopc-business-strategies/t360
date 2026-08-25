import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminAiSettingsScreen extends ConsumerStatefulWidget {
  const AdminAiSettingsScreen({super.key});

  @override
  ConsumerState<AdminAiSettingsScreen> createState() => _AdminAiSettingsScreenState();
}

class _AdminAiSettingsScreenState extends ConsumerState<AdminAiSettingsScreen> {
  Map<String, dynamic>? _settings;
  List<String> _perms = [];
  String? _error;
  bool _saving = false;
  final _daily = TextEditingController();
  final _concurrent = TextEditingController();
  final _perJob = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _daily.dispose();
    _concurrent.dispose();
    _perJob.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final me = await ref.read(adminRepoProvider).me();
      _perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      if (!adminHasAny(_perms, ['ai_settings.view', 'settings.manage'])) {
        setState(() => _error = 'Missing ai_settings.view permission');
        return;
      }
      final s = await ref.read(adminRepoProvider).aiSettings();
      setState(() {
        _settings = s;
        _daily.text = '${s['dailyLimit'] ?? ''}';
        _concurrent.text = '${s['maxConcurrentJobs'] ?? ''}';
        _perJob.text = '${s['maxImagesPerJob'] ?? ''}';
      });
    } catch (e) {
      setState(() => _error = '$e');
    }
  }

  Future<void> _save(Map<String, dynamic> body) async {
    if (!adminHasAny(_perms, ['ai_settings.update', 'settings.manage'])) {
      setState(() => _error = 'Missing ai_settings.update permission');
      return;
    }
    setState(() => _saving = true);
    try {
      final next = await ref.read(adminRepoProvider).updateAiSettings(body);
      setState(() => _settings = next);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = _settings;
    final canUpdate = adminHasAny(_perms, ['ai_settings.update', 'settings.manage']);
    return Scaffold(
      appBar: AppBar(title: const Text('AI Settings')),
      body: s == null
          ? Center(child: _error != null ? Text(_error!) : const CircularProgressIndicator())
          : ListView(
              children: [
                SwitchListTile(
                  title: const Text('AI Fashion'),
                  value: s['enabled'] == true,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'enabled': v}),
                ),
                SwitchListTile(
                  title: const Text('Maintenance mode'),
                  value: s['maintenanceMode'] == true,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'maintenanceMode': v}),
                ),
                SwitchListTile(
                  title: const Text('Product → Model'),
                  value: s['productToModelEnabled'] != false,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'productToModelEnabled': v}),
                ),
                SwitchListTile(
                  title: const Text('Virtual Try-On'),
                  value: s['virtualTryOnEnabled'] != false,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'virtualTryOnEnabled': v}),
                ),
                SwitchListTile(
                  title: const Text('Model creation'),
                  value: s['modelCreationEnabled'] != false,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'modelCreationEnabled': v}),
                ),
                SwitchListTile(
                  title: const Text('Automatic product generation'),
                  value: s['autoGenerateOnCreate'] == true,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'autoGenerateOnCreate': v}),
                ),
                SwitchListTile(
                  title: const Text('Require approval'),
                  value: s['requireApproval'] != false,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'requireApproval': v}),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextField(
                        controller: _daily,
                        decoration: const InputDecoration(labelText: 'Daily limit'),
                        keyboardType: TextInputType.number,
                        enabled: canUpdate,
                      ),
                      TextField(
                        controller: _concurrent,
                        decoration: const InputDecoration(labelText: 'Max concurrent jobs'),
                        keyboardType: TextInputType.number,
                        enabled: canUpdate,
                      ),
                      TextField(
                        controller: _perJob,
                        decoration: const InputDecoration(labelText: 'Max images per job'),
                        keyboardType: TextInputType.number,
                        enabled: canUpdate,
                      ),
                      if (canUpdate)
                        FilledButton(
                          onPressed: _saving
                              ? null
                              : () => _save({
                                    'dailyLimit': int.tryParse(_daily.text),
                                    'maxConcurrentJobs': int.tryParse(_concurrent.text),
                                    'maxImagesPerJob': int.tryParse(_perJob.text),
                                  }),
                          child: const Text('Save limits'),
                        ),
                    ],
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ),
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'API keys stay on the server and are never shown here.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ],
            ),
    );
  }
}
