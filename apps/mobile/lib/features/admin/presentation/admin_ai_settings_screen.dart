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
  List<dynamic> _models = [];
  List<String> _perms = [];
  String? _error;
  bool _saving = false;
  final _daily = TextEditingController();
  final _monthly = TextEditingController();
  final _concurrent = TextEditingController();
  final _perJob = TextEditingController();

  String? _defaultModelId;
  int _defaultNumImages = 1;
  String _defaultResolution = '1k';
  String _defaultGenerationMode = 'fast';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _daily.dispose();
    _monthly.dispose();
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
      final repo = ref.read(adminRepoProvider);
      final s = await repo.aiSettings();
      List<dynamic> models = [];
      try {
        models = await repo.aiModels(activeOnly: true);
      } catch (_) {}
      setState(() {
        _settings = s;
        _models = models;
        _daily.text = '${s['dailyLimit'] ?? ''}';
        _monthly.text = '${s['monthlyLimit'] ?? ''}';
        _concurrent.text = '${s['maxConcurrentJobs'] ?? ''}';
        _perJob.text = '${s['maxImagesPerJob'] ?? ''}';
        _defaultModelId = s['defaultModelId']?.toString();
        _defaultNumImages = (s['defaultNumImages'] as num?)?.toInt() ?? 1;
        _defaultResolution = s['defaultResolution']?.toString() ?? '1k';
        _defaultGenerationMode = s['defaultGenerationMode']?.toString() ?? 'fast';
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
      setState(() {
        _settings = next;
        _defaultModelId = next['defaultModelId']?.toString();
        _defaultNumImages = (next['defaultNumImages'] as num?)?.toInt() ?? _defaultNumImages;
        _defaultResolution = next['defaultResolution']?.toString() ?? _defaultResolution;
        _defaultGenerationMode =
            next['defaultGenerationMode']?.toString() ?? _defaultGenerationMode;
      });
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
                  title: const Text('Image → Video'),
                  subtitle: const Text('Uses FASHN credits; default off'),
                  value: s['videoEnabled'] == true,
                  onChanged: !canUpdate || _saving ? null : (v) => _save({'videoEnabled': v}),
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
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Generation defaults', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String?>(
                        key: ValueKey('def-model-$_defaultModelId'),
                        initialValue: _defaultModelId,
                        decoration: const InputDecoration(labelText: 'Default model'),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('None (product-to-model)')),
                          ..._models.map((m) {
                            final map = m as Map;
                            return DropdownMenuItem(
                              value: map['id']?.toString(),
                              child: Text(map['name']?.toString() ?? 'Model'),
                            );
                          }),
                        ],
                        onChanged: !canUpdate
                            ? null
                            : (v) => setState(() => _defaultModelId = v),
                      ),
                      DropdownButtonFormField<int>(
                        key: ValueKey('def-num-$_defaultNumImages'),
                        initialValue: _defaultNumImages,
                        decoration: const InputDecoration(labelText: 'Default generation count'),
                        items: const [
                          DropdownMenuItem(value: 1, child: Text('1')),
                          DropdownMenuItem(value: 2, child: Text('2')),
                          DropdownMenuItem(value: 4, child: Text('4')),
                        ],
                        onChanged: !canUpdate
                            ? null
                            : (v) => setState(() => _defaultNumImages = v ?? 1),
                      ),
                      DropdownButtonFormField<String>(
                        key: ValueKey('def-res-$_defaultResolution'),
                        initialValue: _defaultResolution,
                        decoration: const InputDecoration(labelText: 'Default resolution'),
                        items: const [
                          DropdownMenuItem(value: '1k', child: Text('1K')),
                          DropdownMenuItem(value: '2k', child: Text('2K')),
                          DropdownMenuItem(value: '4k', child: Text('4K')),
                        ],
                        onChanged: !canUpdate
                            ? null
                            : (v) => setState(() => _defaultResolution = v ?? '1k'),
                      ),
                      DropdownButtonFormField<String>(
                        key: ValueKey('def-mode-$_defaultGenerationMode'),
                        initialValue: _defaultGenerationMode,
                        decoration: const InputDecoration(labelText: 'Default quality'),
                        items: const [
                          DropdownMenuItem(value: 'fast', child: Text('Fast')),
                          DropdownMenuItem(value: 'balanced', child: Text('Balanced')),
                          DropdownMenuItem(value: 'quality', child: Text('Quality')),
                        ],
                        onChanged: !canUpdate
                            ? null
                            : (v) => setState(() => _defaultGenerationMode = v ?? 'fast'),
                      ),
                      const SizedBox(height: 16),
                      Text('Limits', style: Theme.of(context).textTheme.titleMedium),
                      TextField(
                        controller: _daily,
                        decoration: const InputDecoration(labelText: 'Daily limit'),
                        keyboardType: TextInputType.number,
                        enabled: canUpdate,
                      ),
                      TextField(
                        controller: _monthly,
                        decoration: const InputDecoration(labelText: 'Monthly limit'),
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
                                    'defaultModelId': _defaultModelId,
                                    'defaultNumImages': _defaultNumImages,
                                    'defaultResolution': _defaultResolution,
                                    'defaultGenerationMode': _defaultGenerationMode,
                                    'dailyLimit': int.tryParse(_daily.text),
                                    'monthlyLimit': int.tryParse(_monthly.text),
                                    'maxConcurrentJobs': int.tryParse(_concurrent.text),
                                    'maxImagesPerJob': int.tryParse(_perJob.text),
                                  }),
                          child: const Text('Save defaults & limits'),
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
