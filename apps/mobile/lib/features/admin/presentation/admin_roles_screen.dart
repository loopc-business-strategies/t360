import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';

class AdminRolesScreen extends ConsumerStatefulWidget {
  const AdminRolesScreen({super.key});

  @override
  ConsumerState<AdminRolesScreen> createState() => _AdminRolesScreenState();
}

class _AdminRolesScreenState extends ConsumerState<AdminRolesScreen> {
  List<dynamic> _roles = [];
  List<dynamic> _perms = [];
  String? _selectedId;
  Set<String> _codes = {};
  String? _error;
  bool _loading = true;
  bool _saving = false;

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
      final roles = await repo.roles();
      final perms = await repo.permissions();
      setState(() {
        _roles = roles;
        _perms = perms;
        _loading = false;
        if (_selectedId != null) {
          final role = roles.cast<Map>().firstWhere(
            (r) => r['id'] == _selectedId,
            orElse: () => {},
          );
          _codes = ((role['permissions'] as List?) ?? []).map((e) => e.toString()).toSet();
        }
      });
    } catch (e) {
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  void _select(String id) {
    final role = _roles.cast<Map>().firstWhere((r) => r['id'] == id, orElse: () => {});
    setState(() {
      _selectedId = id;
      _codes = ((role['permissions'] as List?) ?? []).map((e) => e.toString()).toSet();
    });
  }

  Future<void> _save() async {
    final id = _selectedId;
    if (id == null) return;
    final role = _roles.cast<Map>().firstWhere((r) => r['id'] == id, orElse: () => {});
    final isSuper = role['code'] == 'SuperAdmin';
    if (isSuper && _codes.isEmpty) {
      setState(() => _error = 'Cannot clear all SuperAdmin permissions');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(adminRepoProvider).updateRolePermissions(id, _codes.toList());
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved')));
      }
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    Map? selected;
    for (final r in _roles) {
      final m = r as Map;
      if (m['id'] == _selectedId) {
        selected = m;
        break;
      }
    }
    final isSuper = selected?['code'] == 'SuperAdmin';
    final saveBlocked = isSuper && _codes.isEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Roles'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _roles.isEmpty
              ? Center(child: Text(_error!))
              : Row(
                  children: [
                    SizedBox(
                      width: 140,
                      child: ListView(
                        children: _roles.map((r) {
                          final m = r as Map;
                          final id = m['id']?.toString() ?? '';
                          return ListTile(
                            dense: true,
                            selected: id == _selectedId,
                            title: Text(m['name']?.toString() ?? '', maxLines: 1),
                            subtitle: Text(m['code']?.toString() ?? '', maxLines: 1),
                            onTap: () => _select(id),
                          );
                        }).toList(),
                      ),
                    ),
                    const VerticalDivider(width: 1),
                    Expanded(
                      child: _selectedId == null
                          ? const Center(child: Text('Select a role'))
                          : Column(
                              children: [
                                if (isSuper)
                                  const Padding(
                                    padding: EdgeInsets.all(12),
                                    child: Text(
                                      'SuperAdmin must keep at least one permission.',
                                      style: TextStyle(color: Colors.grey),
                                    ),
                                  ),
                                Expanded(
                                  child: ListView(
                                    children: _perms.map((p) {
                                      final code = (p as Map)['code']?.toString() ?? '';
                                      return CheckboxListTile(
                                        dense: true,
                                        title: Text(code),
                                        value: _codes.contains(code),
                                        onChanged: (v) => setState(() {
                                          if (v == true) {
                                            _codes.add(code);
                                          } else {
                                            _codes.remove(code);
                                          }
                                        }),
                                      );
                                    }).toList(),
                                  ),
                                ),
                                if (_error != null)
                                  Padding(
                                    padding: const EdgeInsets.all(8),
                                    child: Text(
                                      _error!,
                                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                                    ),
                                  ),
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: FilledButton(
                                    onPressed: _saving || saveBlocked ? null : _save,
                                    child: Text(_saving ? 'Saving…' : 'Save permissions'),
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
    );
  }
}
