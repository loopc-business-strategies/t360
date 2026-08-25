import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';

class AdminAuditScreen extends ConsumerStatefulWidget {
  const AdminAuditScreen({super.key});

  @override
  ConsumerState<AdminAuditScreen> createState() => _AdminAuditScreenState();
}

class _AdminAuditScreenState extends ConsumerState<AdminAuditScreen> {
  late Future<List<dynamic>> _future;
  final _q = TextEditingController();
  final _action = TextEditingController();

  @override
  void initState() {
    super.initState();
    _future = ref.read(adminRepoProvider).auditLogs();
  }

  @override
  void dispose() {
    _q.dispose();
    _action.dispose();
    super.dispose();
  }

  void _search() {
    setState(() {
      _future = ref.read(adminRepoProvider).auditLogs(
            q: _q.text.trim(),
            action: _action.text.trim(),
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Audit Logs'),
        actions: [IconButton(onPressed: _search, icon: const Icon(Icons.refresh))],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  controller: _q,
                  decoration: const InputDecoration(
                    labelText: 'Search',
                    hintText: 'action, entity, actor…',
                  ),
                  onSubmitted: (_) => _search(),
                ),
                TextField(
                  controller: _action,
                  decoration: const InputDecoration(labelText: 'Action filter'),
                  onSubmitted: (_) => _search(),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(onPressed: _search, child: const Text('Filter')),
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder(
              future: _future,
              builder: (context, snap) {
                if (snap.hasError) return Center(child: Text('${snap.error}'));
                if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                final items = snap.data!;
                if (items.isEmpty) return const Center(child: Text('No logs'));
                return ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final m = items[i] as Map;
                    final meta = m['metadata'];
                    return ListTile(
                      title: Text(m['action']?.toString() ?? ''),
                      subtitle: Text(
                        '${m['entityType'] ?? ''} ${m['entityId'] ?? ''}\n'
                        'actor: ${m['actorId'] ?? '—'} · ${m['createdAt'] ?? ''}'
                        '${meta != null ? '\n$meta' : ''}',
                      ),
                      isThreeLine: true,
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
