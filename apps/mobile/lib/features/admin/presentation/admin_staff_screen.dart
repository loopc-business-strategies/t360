import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminStaffScreen extends ConsumerStatefulWidget {
  const AdminStaffScreen({super.key});

  @override
  ConsumerState<AdminStaffScreen> createState() => _AdminStaffScreenState();
}

class _AdminStaffScreenState extends ConsumerState<AdminStaffScreen> {
  late Future<List<dynamic>> _future;
  List<dynamic> _roles = [];
  List<String> _perms = [];
  final _search = TextEditingController();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _code = TextEditingController();
  final Set<String> _createRoles = {};
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _future = _boot();
  }

  @override
  void dispose() {
    _search.dispose();
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<List<dynamic>> _boot() async {
    final repo = ref.read(adminRepoProvider);
    final me = await repo.me();
    _perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
    if (adminHasAny(_perms, ['roles.manage'])) {
      _roles = await repo.roles();
    }
    return repo.employees();
  }

  Future<void> _refresh() async {
    setState(() => _future = ref.read(adminRepoProvider).employees());
  }

  Future<void> _create() async {
    if (_name.text.trim().isEmpty ||
        _email.text.trim().isEmpty ||
        _password.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name, email, and password (8+) required')),
      );
      return;
    }
    setState(() => _creating = true);
    try {
      await ref.read(adminRepoProvider).createEmployee({
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'password': _password.text,
        if (_code.text.trim().isNotEmpty) 'employeeCode': _code.text.trim(),
        if (_createRoles.isNotEmpty) 'roleCodes': _createRoles.toList(),
      });
      _name.clear();
      _email.clear();
      _password.clear();
      _code.clear();
      _createRoles.clear();
      await _refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  Future<void> _editRoles(Map emp) async {
    if (!adminHasAny(_perms, ['roles.manage'])) return;
    final current = ((emp['roles'] as List?) ?? []).map((e) => e.toString()).toSet();
    final selected = {...current};
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('Assign roles'),
          content: SizedBox(
            width: 320,
            child: ListView(
              shrinkWrap: true,
              children: _roles.map((r) {
                final map = r as Map;
                final code = map['code']?.toString() ?? '';
                return CheckboxListTile(
                  dense: true,
                  title: Text(map['name']?.toString() ?? code),
                  subtitle: Text(code),
                  value: selected.contains(code),
                  onChanged: (v) => setLocal(() {
                    if (v == true) {
                      selected.add(code);
                    } else {
                      selected.remove(code);
                    }
                  }),
                );
              }).toList(),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
          ],
        ),
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(adminRepoProvider).setEmployeeRoles(emp['id'].toString(), selected.toList());
      await _refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final canManage = adminHasAny(_perms, ['staff.manage']);
    final canRoles = adminHasAny(_perms, ['roles.manage']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff'),
        actions: [IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh))],
      ),
      body: FutureBuilder(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) return Center(child: Text('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final q = _search.text.trim().toLowerCase();
          final items = snap.data!.where((e) {
            if (q.isEmpty) return true;
            final m = e as Map;
            final hay =
                '${m['name']} ${m['employeeCode']} ${(m['user'] as Map?)?['email']}'.toLowerCase();
            return hay.contains(q);
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(12),
            children: [
              TextField(
                controller: _search,
                decoration: const InputDecoration(
                  hintText: 'Search staff',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (_) => setState(() {}),
              ),
              if (canManage) ...[
                const SizedBox(height: 16),
                Text('Create staff', style: Theme.of(context).textTheme.titleMedium),
                TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
                TextField(
                  controller: _email,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                ),
                TextField(
                  controller: _password,
                  decoration: const InputDecoration(labelText: 'Password'),
                  obscureText: true,
                ),
                TextField(
                  controller: _code,
                  decoration: const InputDecoration(labelText: 'Admin ID (employee code)'),
                ),
                if (_roles.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    children: _roles.map((r) {
                      final code = (r as Map)['code']?.toString() ?? '';
                      final selected = _createRoles.contains(code);
                      return FilterChip(
                        label: Text(code),
                        selected: selected,
                        onSelected: (v) => setState(() {
                          if (v) {
                            _createRoles.add(code);
                          } else {
                            _createRoles.remove(code);
                          }
                        }),
                      );
                    }).toList(),
                  ),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: _creating ? null : _create,
                  child: Text(_creating ? 'Creating…' : 'Create staff'),
                ),
                const Divider(height: 32),
              ],
              ...items.map((e) {
                final m = e as Map;
                final user = m['user'] as Map? ?? {};
                final status = user['status']?.toString() ?? '';
                final roles = ((m['roles'] as List?) ?? []).join(', ');
                return ListTile(
                  title: Text(m['name']?.toString() ?? 'Staff'),
                  subtitle: Text(
                    '${m['employeeCode'] ?? '—'} · ${user['email'] ?? ''}\n$roles · $status',
                  ),
                  isThreeLine: true,
                  trailing: Wrap(
                    spacing: 4,
                    children: [
                      if (canRoles)
                        IconButton(
                          icon: const Icon(Icons.security),
                          onPressed: () => _editRoles(m),
                        ),
                      if (canManage)
                        IconButton(
                          icon: Icon(status == 'active' ? Icons.person_off : Icons.person),
                          onPressed: () async {
                            try {
                              await ref.read(adminRepoProvider).updateEmployee(
                                m['id'].toString(),
                                {'status': status == 'active' ? 'inactive' : 'active'},
                              );
                              await _refresh();
                            } catch (err) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(SnackBar(content: Text('$err')));
                              }
                            }
                          },
                        ),
                    ],
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
