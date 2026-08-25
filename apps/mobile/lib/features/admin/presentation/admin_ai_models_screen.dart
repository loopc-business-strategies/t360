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
  final _search = TextEditingController();
  String _filter = 'all';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _boot();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<List<dynamic>> _boot() async {
    final me = await ref.read(adminRepoProvider).me();
    _perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
    return ref.read(adminRepoProvider).aiModels();
  }

  Future<void> _openModelForm({required bool generateWithAi}) async {
    final name = TextEditingController();
    final url = TextEditingController();
    final ageRange = TextEditingController();
    final style = TextEditingController();
    final bodyType = TextEditingController();
    final skinTone = TextEditingController();
    final hairStyle = TextEditingController();
    String gender = 'female';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: Text(generateWithAi ? 'Generate model with AI' : 'Add model by URL'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
                DropdownButtonFormField<String>(
                  initialValue: gender,
                  items: const [
                    DropdownMenuItem(value: 'female', child: Text('Female')),
                    DropdownMenuItem(value: 'male', child: Text('Male')),
                    DropdownMenuItem(value: 'unisex', child: Text('Unisex')),
                  ],
                  onChanged: (v) => setLocal(() => gender = v ?? gender),
                  decoration: const InputDecoration(labelText: 'Gender'),
                ),
                TextField(controller: ageRange, decoration: const InputDecoration(labelText: 'Age range')),
                TextField(controller: style, decoration: const InputDecoration(labelText: 'Style')),
                TextField(controller: bodyType, decoration: const InputDecoration(labelText: 'Body type')),
                TextField(controller: skinTone, decoration: const InputDecoration(labelText: 'Skin tone')),
                TextField(controller: hairStyle, decoration: const InputDecoration(labelText: 'Hair style')),
                if (!generateWithAi)
                  TextField(
                    controller: url,
                    decoration: const InputDecoration(labelText: 'Image URL *'),
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(generateWithAi ? 'Generate' : 'Create'),
            ),
          ],
        ),
      ),
    );
    if (ok != true) return;

    setState(() => _busy = true);
    try {
      final attrs = <String, dynamic>{
        if (name.text.trim().isNotEmpty) 'name': name.text.trim(),
        'gender': gender,
        if (ageRange.text.trim().isNotEmpty) 'ageRange': ageRange.text.trim(),
        if (style.text.trim().isNotEmpty) 'style': style.text.trim(),
        if (bodyType.text.trim().isNotEmpty) 'bodyType': bodyType.text.trim(),
        if (skinTone.text.trim().isNotEmpty) 'skinTone': skinTone.text.trim(),
        if (hairStyle.text.trim().isNotEmpty) 'hairStyle': hairStyle.text.trim(),
      };

      if (generateWithAi) {
        await ref.read(adminRepoProvider).generateAiModel({
          ...attrs,
          'saveToLibrary': true,
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Model generation queued — check AI Images when done')),
          );
        }
      } else {
        final n = name.text.trim();
        final imageUrl = url.text.trim();
        if (n.isEmpty || imageUrl.isEmpty) {
          throw Exception('Name and image URL are required');
        }
        await ref.read(adminRepoProvider).createAiModel({
          'name': n,
          'imageUrl': imageUrl,
          'gender': gender,
          'isActive': true,
          if (ageRange.text.trim().isNotEmpty) 'ageRange': ageRange.text.trim(),
          if (style.text.trim().isNotEmpty) 'style': style.text.trim(),
          if (bodyType.text.trim().isNotEmpty) 'bodyType': bodyType.text.trim(),
          if (skinTone.text.trim().isNotEmpty) 'skinTone': skinTone.text.trim(),
          if (hairStyle.text.trim().isNotEmpty) 'hairStyle': hairStyle.text.trim(),
        });
      }
      setState(() => _future = ref.read(adminRepoProvider).aiModels());
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canUpdate = adminHasAny(_perms, ['ai_models.update', 'ai.fashion']);
    final canCreate = adminHasAny(_perms, ['ai_models.create']);
    final canDelete = adminHasAny(_perms, ['ai_models.delete']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Models'),
        actions: [
          if (canCreate) ...[
            IconButton(
              onPressed: _busy ? null : () => _openModelForm(generateWithAi: true),
              icon: const Icon(Icons.auto_awesome),
              tooltip: 'Generate with AI',
            ),
            IconButton(
              onPressed: _busy ? null : () => _openModelForm(generateWithAi: false),
              icon: const Icon(Icons.add_link),
              tooltip: 'Add by URL',
            ),
          ],
        ],
      ),
      body: FutureBuilder(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) return Center(child: Text('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final q = _search.text.trim().toLowerCase();
          var items = snap.data!;
          if (_filter == 'active') {
            items = items.where((m) => (m as Map)['isActive'] == true).toList();
          } else if (_filter == 'inactive') {
            items = items.where((m) => (m as Map)['isActive'] != true).toList();
          }
          if (q.isNotEmpty) {
            items = items.where((m) {
              final map = m as Map;
              return '${map['name']} ${map['gender']} ${map['style']}'.toLowerCase().contains(q);
            }).toList();
          }

          return Column(
            children: [
              if (_busy) const LinearProgressIndicator(),
              Padding(
                padding: const EdgeInsets.all(12),
                child: TextField(
                  controller: _search,
                  decoration: const InputDecoration(
                    hintText: 'Search models',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'all', label: Text('All')),
                  ButtonSegment(value: 'active', label: Text('Active')),
                  ButtonSegment(value: 'inactive', label: Text('Inactive')),
                ],
                selected: {_filter},
                onSelectionChanged: (s) => setState(() => _filter = s.first),
              ),
              Expanded(
                child: ListView(
                  children: items.map((m) {
                    final map = m as Map;
                    final id = map['id']?.toString();
                    final active = map['isActive'] == true;
                    return ListTile(
                      leading: map['imageUrl'] != null
                          ? Image.network(
                              map['imageUrl'].toString(),
                              width: 48,
                              height: 48,
                              fit: BoxFit.cover,
                            )
                          : const Icon(Icons.person),
                      title: Text(map['name']?.toString() ?? 'Model'),
                      subtitle: Text(
                        '${map['gender'] ?? ''} · ${map['style'] ?? ''} · ${map['ageRange'] ?? ''}',
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (canUpdate && id != null)
                            Switch(
                              value: active,
                              onChanged: (v) async {
                                await ref
                                    .read(adminRepoProvider)
                                    .updateAiModel(id, {'isActive': v});
                                setState(
                                  () => _future = ref.read(adminRepoProvider).aiModels(),
                                );
                              },
                            ),
                          if (canDelete && id != null)
                            IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: () async {
                                final confirm = await showDialog<bool>(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: const Text('Delete model?'),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(ctx, false),
                                        child: const Text('Cancel'),
                                      ),
                                      FilledButton(
                                        onPressed: () => Navigator.pop(ctx, true),
                                        child: const Text('Delete'),
                                      ),
                                    ],
                                  ),
                                );
                                if (confirm != true) return;
                                try {
                                  await ref.read(adminRepoProvider).deleteAiModel(id);
                                  setState(
                                    () => _future = ref.read(adminRepoProvider).aiModels(),
                                  );
                                } catch (e) {
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(SnackBar(content: Text('$e')));
                                  }
                                }
                              },
                            ),
                        ],
                      ),
                      onTap: () {
                        showModalBottomSheet<void>(
                          context: context,
                          builder: (ctx) => Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  map['name']?.toString() ?? '',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                Text('Gender: ${map['gender']}'),
                                Text('Active: $active'),
                                Text('Age: ${map['ageRange'] ?? '—'}'),
                                Text('Style: ${map['style'] ?? '—'}'),
                                Text('Body: ${map['bodyType'] ?? '—'}'),
                                Text('Skin: ${map['skinTone'] ?? '—'}'),
                                Text('Hair: ${map['hairStyle'] ?? '—'}'),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  }).toList(),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
