import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminAiModelsScreen extends ConsumerStatefulWidget {
  const AdminAiModelsScreen({super.key});

  @override
  ConsumerState<AdminAiModelsScreen> createState() => _AdminAiModelsScreenState();
}

class _AdminAiModelsScreenState extends ConsumerState<AdminAiModelsScreen> {
  late Future<List<dynamic>> _future;
  List<String> _perms = [];

  @override
  void initState() {
    super.initState();
    _future = _boot();
  }

  Future<List<dynamic>> _boot() async {
    final me = await ref.read(adminRepoProvider).me();
    _perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
    return ref.read(adminRepoProvider).aiModels();
  }

  @override
  Widget build(BuildContext context) {
    final canUpdate = adminHasAny(_perms, ['ai_models.update', 'ai.fashion']);
    return Scaffold(
      appBar: AppBar(title: const Text('AI Models')),
      body: FutureBuilder(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) return Center(child: Text('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final items = snap.data!;
          return ListView(
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Create / upload advanced models in web admin. Activate or deactivate here if permitted.',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
              ...items.map((m) {
                final map = m as Map;
                final id = map['id']?.toString();
                final active = map['isActive'] == true;
                return SwitchListTile(
                  title: Text(map['name']?.toString() ?? 'Model'),
                  subtitle: Text(map['gender']?.toString() ?? ''),
                  value: active,
                  onChanged: !canUpdate || id == null
                      ? null
                      : (v) async {
                          await ref.read(adminRepoProvider).updateAiModel(id, {'isActive': v});
                          setState(() => _future = ref.read(adminRepoProvider).aiModels());
                        },
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
