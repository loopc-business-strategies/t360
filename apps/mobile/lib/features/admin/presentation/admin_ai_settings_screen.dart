import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';

class AdminAiSettingsScreen extends ConsumerStatefulWidget {
  const AdminAiSettingsScreen({super.key});

  @override
  ConsumerState<AdminAiSettingsScreen> createState() => _AdminAiSettingsScreenState();
}

class _AdminAiSettingsScreenState extends ConsumerState<AdminAiSettingsScreen> {
  Map<String, dynamic>? _settings;
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final s = await ref.read(adminRepoProvider).aiSettings();
      setState(() => _settings = s);
    } catch (e) {
      setState(() => _error = '$e');
    }
  }

  Future<void> _save(String key, bool value) async {
    setState(() => _saving = true);
    try {
      final next = await ref.read(adminRepoProvider).updateAiSettings({key: value});
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
    return Scaffold(
      appBar: AppBar(title: const Text('AI Settings')),
      body: s == null
          ? Center(child: _error != null ? Text(_error!) : const CircularProgressIndicator())
          : ListView(
              children: [
                SwitchListTile(
                  title: const Text('AI Fashion'),
                  value: s['enabled'] == true,
                  onChanged: _saving ? null : (v) => _save('enabled', v),
                ),
                SwitchListTile(
                  title: const Text('Product → Model'),
                  value: s['productToModelEnabled'] != false,
                  onChanged: _saving ? null : (v) => _save('productToModelEnabled', v),
                ),
                SwitchListTile(
                  title: const Text('Virtual Try-On'),
                  value: s['virtualTryOnEnabled'] != false,
                  onChanged: _saving ? null : (v) => _save('virtualTryOnEnabled', v),
                ),
                SwitchListTile(
                  title: const Text('Automatic product generation'),
                  value: s['autoGenerateOnCreate'] == true,
                  onChanged: _saving ? null : (v) => _save('autoGenerateOnCreate', v),
                ),
                SwitchListTile(
                  title: const Text('Require approval'),
                  value: s['requireApproval'] != false,
                  onChanged: _saving ? null : (v) => _save('requireApproval', v),
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
