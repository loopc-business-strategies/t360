import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/biometric_auth.dart';
import '../../../core/providers.dart';
import '../../auth/data/auth_repository.dart';
import 'admin_home_screen.dart';

class AdminLoginScreen extends ConsumerStatefulWidget {
  const AdminLoginScreen({super.key});

  @override
  ConsumerState<AdminLoginScreen> createState() => _AdminLoginScreenState();
}

class _AdminLoginScreenState extends ConsumerState<AdminLoginScreen> {
  final _id = TextEditingController();
  final _password = TextEditingController();
  final _mfa = TextEditingController();
  final _bio = BiometricAuthService();
  String? _error;
  bool _loading = false;
  bool _needsMfa = false;
  bool _obscure = true;
  bool _bioAvailable = false;
  bool _bioEnabled = false;

  @override
  void initState() {
    super.initState();
    _initBio();
  }

  Future<void> _initBio() async {
    final available = await _bio.canCheckBiometrics();
    final enabled = await _bio.isEnabled();
    final tokens = ref.read(tokenStorageProvider);
    final hasRefresh = (await tokens.getRefresh())?.isNotEmpty == true;
    final mode = await tokens.getMode();
    if (mounted) {
      setState(() {
        _bioAvailable = available;
        _bioEnabled = enabled && hasRefresh && mode == 'staff';
      });
    }
  }

  @override
  void dispose() {
    _id.dispose();
    _password.dispose();
    _mfa.dispose();
    super.dispose();
  }

  Future<void> _unlockWithBiometric() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final ok = await _bio.authenticate();
      if (!ok) {
        setState(() => _error = 'Biometric unlock cancelled');
        return;
      }
      final tokens = ref.read(tokenStorageProvider);
      final access = await tokens.getAccess();
      final refresh = await tokens.getRefresh();
      if (access == null || refresh == null) {
        setState(() => _error = 'No saved session — sign in with password once');
        await _bio.setEnabled(false);
        return;
      }
      await ref.read(authStateProvider.notifier).markLoggedIn(staff: true);
      if (mounted) context.go('/admin');
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
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
      if (_bioAvailable) {
        final enable = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Enable biometric unlock?'),
            content: const Text(
              'Use Face ID / fingerprint next time instead of typing your password. '
              'Tokens stay on this device only.',
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Not now')),
              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Enable')),
            ],
          ),
        );
        if (enable == true) await _bio.setEnabled(true);
      }
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

  Future<void> _forgotPassword() async {
    final email = TextEditingController(text: _id.text.contains('@') ? _id.text.trim() : '');
    final tokenCtrl = TextEditingController();
    final newPwd = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset password'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: email,
                decoration: const InputDecoration(labelText: 'Staff email'),
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () async {
                  try {
                    final data = await ref.read(adminRepoProvider).requestPasswordReset(email.text.trim());
                    final token = data['resetToken']?.toString();
                    if (token != null) tokenCtrl.text = token;
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            token != null
                                ? 'Dev reset token filled — set a new password'
                                : 'If the account exists, reset was issued',
                          ),
                        ),
                      );
                    }
                  } catch (e) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
                    }
                  }
                },
                child: const Text('Request reset'),
              ),
              TextField(
                controller: tokenCtrl,
                decoration: const InputDecoration(labelText: 'Reset token'),
              ),
              TextField(
                controller: newPwd,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'New password'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          FilledButton(
            onPressed: () async {
              try {
                await ref.read(adminRepoProvider).resetPassword(
                      token: tokenCtrl.text.trim(),
                      newPassword: newPwd.text,
                    );
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Password updated — sign in')),
                  );
                }
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
                }
              }
            },
            child: const Text('Set password'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin login')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Tharagai 360',
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Staff / admin access. Your role comes from the server — not this screen.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          if (_bioEnabled) ...[
            FilledButton.icon(
              onPressed: _loading ? null : _unlockWithBiometric,
              icon: const Icon(Icons.fingerprint),
              label: Text(_loading ? 'Unlocking…' : 'Unlock with biometrics'),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
          ],
          TextField(
            controller: _id,
            decoration: const InputDecoration(labelText: 'Email or Admin ID'),
            autocorrect: false,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            decoration: InputDecoration(
              labelText: 'Password',
              suffixIcon: IconButton(
                icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            obscureText: _obscure,
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
          TextButton(onPressed: _forgotPassword, child: const Text('Forgot password')),
          TextButton(
            onPressed: () => context.go('/auth'),
            child: const Text('Customer OTP login'),
          ),
        ],
      ),
    );
  }
}
