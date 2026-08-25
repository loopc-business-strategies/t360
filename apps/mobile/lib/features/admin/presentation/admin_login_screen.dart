import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../../auth/data/auth_repository.dart';

class AdminLoginScreen extends ConsumerStatefulWidget {
  const AdminLoginScreen({super.key});

  @override
  ConsumerState<AdminLoginScreen> createState() => _AdminLoginScreenState();
}

class _AdminLoginScreenState extends ConsumerState<AdminLoginScreen> {
  final _id = TextEditingController(text: 'owner@tharagai.local');
  final _password = TextEditingController(text: 'TharagaiOwner!123');
  final _mfa = TextEditingController();
  String? _error;
  bool _loading = false;
  bool _needsMfa = false;

  @override
  void dispose() {
    _id.dispose();
    _password.dispose();
    _mfa.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final tokens = ref.read(tokenStorageProvider);
      final auth = AuthRepository(api);
      final isEmail = _id.text.contains('@');
      final result = await auth.staffLogin(
        email: isEmail ? _id.text.trim() : null,
        employeeCode: isEmail ? null : _id.text.trim(),
        password: _password.text,
        mfaCode: _mfa.text.trim().isEmpty ? null : _mfa.text.trim(),
      );
      await tokens.saveTokens(access: result.access, refresh: result.refresh);
      await ref.read(authStateProvider.notifier).markLoggedIn(staff: true);
      if (mounted) context.go('/admin');
    } catch (e) {
      final msg = e.toString();
      setState(() {
        _error = msg;
        if (msg.toUpperCase().contains('MFA')) _needsMfa = true;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin login')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Sign in with the same staff account as web admin.'),
          const SizedBox(height: 16),
          TextField(
            controller: _id,
            decoration: const InputDecoration(labelText: 'Email or Admin ID'),
            autocorrect: false,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          if (_needsMfa) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _mfa,
              decoration: const InputDecoration(labelText: 'MFA code'),
              keyboardType: TextInputType.number,
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: Text(_loading ? 'Signing in…' : 'Sign in'),
          ),
          TextButton(
            onPressed: () => context.go('/auth'),
            child: const Text('Customer OTP login'),
          ),
        ],
      ),
    );
  }
}
