import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/biometric_auth.dart';
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
  final _mfaCode = TextEditingController();
  final _bio = BiometricAuthService();
  bool _bioOn = false;
  bool _bioAvailable = false;
  Map<String, dynamic>? _mfaSetup;
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
    final bioOn = await _bio.isEnabled();
    final bioAvail = await _bio.canCheckBiometrics();
    if (mounted) {
      setState(() {
        _me = me;
        _sessions = sessions;
        _bioOn = bioOn;
        _bioAvailable = bioAvail;
      });
    }
  }

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _mfaCode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emp = _me?['employee'] as Map?;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile & security')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Name: ${emp?['name'] ?? '—'}'),
          Text('Admin ID: ${emp?['employeeCode'] ?? '—'}'),
          Text('Email: ${_me?['email'] ?? '—'}'),
          Text('Roles: ${((_me?['roles'] as List?) ?? []).join(', ')}'),
          Text('MFA: ${(_me?['mfaEnabled'] == true) ? 'On' : 'Off'}'),
          const SizedBox(height: 16),
          Text('Two-factor authentication', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (_mfaSetup == null)
            OutlinedButton(
              onPressed: () async {
                try {
                  final data = await ref.read(adminRepoProvider).mfaSetup();
                  setState(() {
                    _mfaSetup = data;
                    _msg = 'Scan the secret in your authenticator, then enter the code.';
                  });
                } catch (e) {
                  setState(() => _msg = '$e');
                }
              },
              child: Text((_me?['mfaEnabled'] == true) ? 'Re-enroll MFA' : 'Set up MFA'),
            )
          else ...[
            SelectableText(
              'Secret: ${_mfaSetup!['secret'] ?? ''}',
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
            ),
            if (_mfaSetup!['otpauthUrl'] != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  '${_mfaSetup!['otpauthUrl']}',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
            TextField(
              controller: _mfaCode,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: '6-digit code'),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: () async {
                try {
                  await ref.read(adminRepoProvider).mfaEnable(_mfaCode.text.trim());
                  _mfaCode.clear();
                  setState(() {
                    _mfaSetup = null;
                    _msg = 'MFA enabled.';
                  });
                  await _load();
                } catch (e) {
                  setState(() => _msg = '$e');
                }
              },
              child: const Text('Confirm MFA'),
            ),
            TextButton(
              onPressed: () => setState(() => _mfaSetup = null),
              child: const Text('Cancel'),
            ),
          ],
          const SizedBox(height: 16),
          if (_bioAvailable)
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Biometric unlock'),
              subtitle: const Text('Unlock this device with Face ID / fingerprint'),
              value: _bioOn,
              onChanged: (v) async {
                await _bio.setEnabled(v);
                setState(() => _bioOn = v);
              },
            ),
          const SizedBox(height: 8),
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
              await _bio.setEnabled(false);
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
            final id = map['id']?.toString();
            final current = map['current'] == true;
            return ListTile(
              dense: true,
              title: Text(map['userAgent']?.toString() ?? 'Session'),
              subtitle: Text('${map['createdAt'] ?? ''} ${current ? '(this device)' : ''}'),
              trailing: current || id == null
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.logout),
                      onPressed: () async {
                        try {
                          await ref.read(adminRepoProvider).revokeSession(id);
                          await _load();
                        } catch (e) {
                          setState(() => _msg = '$e');
                        }
                      },
                    ),
            );
          }),
          if (_msg != null) Text(_msg!),
        ],
      ),
    );
  }
}
