import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import 'admin_home_screen.dart';

class AdminProfileScreen extends ConsumerStatefulWidget {
  const AdminProfileScreen({super.key});

  @override
  ConsumerState<AdminProfileScreen> createState() => _AdminProfileScreenState();
}

class _AdminProfileScreenState extends ConsumerState<AdminProfileScreen> {
  Map<String, dynamic>? _me;
  List<dynamic> _sessions = [];
  final _current = TextEditingController();
  final _next = TextEditingController();
  String? _msg;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = ref.read(adminRepoProvider);
    final me = await repo.me();
    List<dynamic> sessions = [];
    try {
      sessions = await repo.sessions();
    } catch (_) {}
    if (mounted) {
      setState(() {
        _me = me;
        _sessions = sessions;
      });
    }
  }

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emp = _me?['employee'] as Map?;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Name: ${emp?['name'] ?? '—'}'),
          Text('Admin ID: ${emp?['employeeCode'] ?? '—'}'),
          Text('Email: ${_me?['email'] ?? '—'}'),
          Text('Roles: ${((_me?['roles'] as List?) ?? []).join(', ')}'),
          const SizedBox(height: 24),
          TextField(controller: _current, obscureText: true, decoration: const InputDecoration(labelText: 'Current password')),
          TextField(controller: _next, obscureText: true, decoration: const InputDecoration(labelText: 'New password')),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () async {
              try {
                await ref.read(adminRepoProvider).changePassword(_current.text, _next.text);
                await ref.read(authStateProvider.notifier).markLoggedOut();
                if (!context.mounted) return;
                context.go('/admin/login');
              } catch (e) {
                setState(() => _msg = '$e');
              }
            },
            child: const Text('Change password'),
          ),
          OutlinedButton(
            onPressed: () async {
              await ref.read(adminRepoProvider).logoutAll();
              await ref.read(authStateProvider.notifier).markLoggedOut();
              if (!context.mounted) return;
              context.go('/admin/login');
            },
            child: const Text('Logout all devices'),
          ),
          const SizedBox(height: 16),
          Text('Sessions', style: Theme.of(context).textTheme.titleMedium),
          ..._sessions.map((s) {
            final map = s as Map;
            return ListTile(
              dense: true,
              title: Text(map['userAgent']?.toString() ?? 'Session'),
              subtitle: Text('${map['createdAt'] ?? ''} ${map['current'] == true ? '(this device)' : ''}'),
            );
          }),
          if (_msg != null) Text(_msg!),
        ],
      ),
    );
  }
}
