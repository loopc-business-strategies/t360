import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api_exception.dart';
import '../../../design_system/design_system.dart';
import '../../repositories.dart';
import '../../auth/presentation/auth_screen.dart';

class CompleteProfileScreen extends ConsumerStatefulWidget {
  const CompleteProfileScreen({super.key, this.redirectTo});

  final String? redirectTo;

  @override
  ConsumerState<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends ConsumerState<CompleteProfileScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  var _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _save({bool skip = false}) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (!skip) {
        await ref.read(accountRepositoryProvider).updateProfile({
          'name': _name.text.trim().isEmpty ? null : _name.text.trim(),
          if (_email.text.trim().isNotEmpty) 'email': _email.text.trim(),
        });
      }
      if (!mounted) return;
      final dest = widget.redirectTo;
      if (dest != null && dest.isNotEmpty) {
        context.go(dest);
      } else {
        context.go('/');
      }
    } on ApiException catch (e) {
      setState(() => _error = mapAuthError(e));
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const TharagaiAppBar(title: 'Complete profile'),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Optional — you can skip and finish later.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          TharagaiInput(label: 'Name', controller: _name),
          const SizedBox(height: 12),
          TharagaiInput(
            label: 'Email (optional)',
            controller: _email,
            keyboardType: TextInputType.emailAddress,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: TharagaiColors.wine)),
          ],
          const SizedBox(height: 24),
          TharagaiButton(
            label: 'Save',
            onPressed: _busy ? null : () => _save(),
          ),
          const SizedBox(height: 8),
          TharagaiButton(
            label: 'Skip for now',
            variant: TharagaiButtonVariant.outline,
            onPressed: _busy ? null : () => _save(skip: true),
          ),
        ],
      ),
    );
  }
}
