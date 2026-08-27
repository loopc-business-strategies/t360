import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminForgotPasswordScreen extends ConsumerStatefulWidget {
  const AdminForgotPasswordScreen({super.key});

  @override
  ConsumerState<AdminForgotPasswordScreen> createState() => _AdminForgotPasswordScreenState();
}

class _AdminForgotPasswordScreenState extends ConsumerState<AdminForgotPasswordScreen> {
  final _email = TextEditingController();
  final _token = TextEditingController();
  final _newPassword = TextEditingController();
  bool _requesting = false;
  bool _resetting = false;
  String? _message;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _token.dispose();
    _newPassword.dispose();
    super.dispose();
  }

  Future<void> _requestReset() async {
    setState(() {
      _requesting = true;
      _error = null;
      _message = null;
    });
    try {
      final data = await ref.read(adminRepoProvider).requestPasswordReset(_email.text.trim());
      final token = data['resetToken']?.toString();
      if (token != null && token.isNotEmpty) {
        _token.text = token;
      }
      if (mounted) {
        setState(() {
          _message = token != null
              ? 'Dev reset token filled — set a new password'
              : 'If the account exists, a reset was issued';
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  Future<void> _resetPassword() async {
    setState(() {
      _resetting = true;
      _error = null;
      _message = null;
    });
    try {
      await ref.read(adminRepoProvider).resetPassword(
            token: _token.text.trim(),
            newPassword: _newPassword.text,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password updated — sign in')),
        );
        context.go('/admin/login');
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _resetting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Forgot password')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Request a password reset for your staff email, then set a new password with the token.',
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _email,
            decoration: const InputDecoration(labelText: 'Staff email'),
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _requesting ? null : _requestReset,
            child: Text(_requesting ? 'Requesting…' : 'Request reset'),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _token,
            decoration: const InputDecoration(labelText: 'Reset token'),
          ),
          TextField(
            controller: _newPassword,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'New password'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(_message!),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _resetting ? null : _resetPassword,
            child: Text(_resetting ? 'Updating…' : 'Set password'),
          ),
          TextButton(
            onPressed: () => context.go('/admin/login'),
            child: const Text('Back to login'),
          ),
        ],
      ),
    );
  }
}
