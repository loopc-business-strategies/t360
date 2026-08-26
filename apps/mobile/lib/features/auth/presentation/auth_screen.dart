import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_exception.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/phone_normalize.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key, this.redirectTo});

  final String? redirectTo;

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _mobile = TextEditingController(text: '+91');
  final _otp = TextEditingController();
  var _otpSent = false;
  var _busy = false;
  String? _error;
  String? _devOtpHint;

  @override
  void dispose() {
    _mobile.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    setState(() {
      _busy = true;
      _error = null;
      _devOtpHint = null;
    });
    try {
      final normalized = normalizeIndianMobile(_mobile.text);
      _mobile.text = normalized;
      final res = await ref.read(authRepositoryProvider).requestOtp(normalized);
      if (res.devOtp != null && res.devOtp!.isNotEmpty) {
        _otp.text = res.devOtp!;
        _devOtpHint = 'Staging code: ${res.devOtp}';
      }
      setState(() => _otpSent = true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final normalized = normalizeIndianMobile(_mobile.text);
      _mobile.text = normalized;
      final tokens = await ref.read(authRepositoryProvider).verifyOtp(
            normalized,
            _otp.text.trim(),
          );
      await ref.read(tokenStorageProvider).saveTokens(
            access: tokens.access,
            refresh: tokens.refresh,
          );
      await ref.read(authStateProvider.notifier).markLoggedIn();
      if (!mounted) return;
      final dest = widget.redirectTo;
      if (dest != null && dest.isNotEmpty) {
        context.go(dest);
      } else {
        context.go('/');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      appBar: TharagaiAppBar(title: t.account),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(t.loginRequired, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Use +91 and your 10-digit mobile number',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 24),
          TharagaiInput(
            label: t.mobile,
            controller: _mobile,
            keyboardType: TextInputType.phone,
          ),
          if (_otpSent) ...[
            const SizedBox(height: 12),
            TharagaiInput(
              label: t.otp,
              controller: _otp,
              keyboardType: TextInputType.number,
            ),
          ],
          if (_devOtpHint != null) ...[
            const SizedBox(height: 12),
            Material(
              color: Theme.of(context).colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(_devOtpHint!, style: Theme.of(context).textTheme.titleSmall),
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: TharagaiColors.wine)),
          ],
          const SizedBox(height: 24),
          TharagaiButton(
            label: _otpSent ? t.verifyOtp : t.requestOtp,
            onPressed: _busy
                ? null
                : () {
                    if (_otpSent) {
                      _verify();
                    } else {
                      _request();
                    }
                  },
          ),
        ],
      ),
    );
  }
}
