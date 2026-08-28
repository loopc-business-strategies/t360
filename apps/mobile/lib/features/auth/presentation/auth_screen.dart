import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_exception.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/phone_normalize.dart';

String mapAuthError(Object e) {
  if (e is ApiException) {
    switch (e.code) {
      case 'INVALID_OTP':
        return 'Invalid or expired OTP.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please try again later.';
      case 'MFA_REQUIRED':
        return 'Enter your verification code.';
      case 'INVALID_CREDENTIALS':
        return 'Email/ID or password is incorrect.';
      case 'ACCOUNT_LOCKED':
        return 'Account temporarily locked. Try again later.';
      case 'ACCOUNT_INACTIVE':
        return 'Your account is inactive.';
      case 'INVALID_REFRESH':
      case 'REFRESH_REUSE':
        return 'Your session has expired. Please sign in again.';
      case 'STAFF_REQUIRED':
      case 'NO_STAFF_ROLE':
        return 'You do not have permission to access Admin.';
      case 'DEMO_LOGIN_DISABLED':
        return 'Demo login is disabled on this server.';
      default:
        return e.message;
    }
  }
  return e.toString();
}

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
  var _demoBusy = false;
  String? _error;
  String? _devOtpHint;
  int _resendIn = 0;

  @override
  void dispose() {
    _mobile.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _tickResend() async {
    while (_resendIn > 0 && mounted) {
      await Future<void>.delayed(const Duration(seconds: 1));
      if (!mounted) return;
      setState(() => _resendIn -= 1);
    }
  }

  Future<void> _request() async {
    setState(() {
      _busy = true;
      _error = null;
      _devOtpHint = null;
    });
    try {
      final normalized = normalizeIndianMobile(_mobile.text);
      if (!isValidIndianMobile(normalized)) {
        setState(() => _error = 'Enter a valid 10-digit mobile starting with 6–9.');
        return;
      }
      _mobile.text = normalized;
      final res = await ref.read(authRepositoryProvider).requestOtp(normalized);
      if (res.devOtp != null && res.devOtp!.isNotEmpty) {
        _otp.text = res.devOtp!;
        _devOtpHint = 'Dev code: ${res.devOtp}';
      }
      setState(() {
        _otpSent = true;
        _resendIn = 30;
      });
      _tickResend();
      if (res.devOtp != null && res.devOtp!.isNotEmpty) {
        await _verify(auto: true);
      }
    } catch (e) {
      setState(() => _error = mapAuthError(e));
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _verify({bool auto = false}) async {
    setState(() {
      _busy = true;
      if (!auto) _error = null;
    });
    try {
      final normalized = normalizeIndianMobile(_mobile.text);
      final code = _otp.text.trim();
      if (!RegExp(r'^\d{6}$').hasMatch(code)) {
        setState(() => _error = 'Enter the 6-digit OTP.');
        return;
      }
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
      if (tokens.isNewCustomer) {
        context.go('/account/complete-profile?redirect=${Uri.encodeComponent(widget.redirectTo ?? '/')}');
        return;
      }
      final dest = widget.redirectTo;
      if (dest != null && dest.isNotEmpty) {
        context.go(dest);
      } else {
        context.go('/');
      }
    } catch (e) {
      setState(() => _error = mapAuthError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _demoSignIn(String role) async {
    setState(() {
      _demoBusy = true;
      _error = null;
    });
    try {
      final result = await ref.read(authRepositoryProvider).demoSignIn(role);
      await ref.read(tokenStorageProvider).saveTokens(
            access: result.access,
            refresh: result.refresh,
          );
      await ref.read(authStateProvider.notifier).markLoggedIn(staff: role == 'staff');
      if (!mounted) return;
      if (role == 'staff') {
        context.go('/admin');
        return;
      }
      if (result.isNewCustomer) {
        context.go('/account/complete-profile?redirect=${Uri.encodeComponent(widget.redirectTo ?? '/')}');
        return;
      }
      final dest = widget.redirectTo;
      if (dest != null && dest.isNotEmpty) {
        context.go(dest);
      } else {
        context.go('/');
      }
    } catch (e) {
      setState(() => _error = mapAuthError(e));
    } finally {
      if (mounted) setState(() => _demoBusy = false);
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
            'New customer? Your account will be created after OTP verification.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
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
          if (_otpSent) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: _busy || _resendIn > 0 ? null : _request,
              child: Text(_resendIn > 0 ? 'Resend in ${_resendIn}s' : 'Resend OTP'),
            ),
            TextButton(
              onPressed: _busy
                  ? null
                  : () => setState(() {
                        _otpSent = false;
                        _otp.clear();
                        _devOtpHint = null;
                        _resendIn = 0;
                      }),
              child: const Text('Change number'),
            ),
          ],
          if (!_otpSent) ...[
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 16),
            Text(
              'Quick demo (remove before production)',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            TharagaiButton(
              label: _demoBusy ? 'Signing in…' : 'Demo customer sign in',
              variant: TharagaiButtonVariant.outline,
              onPressed: _busy || _demoBusy ? null : () => _demoSignIn('customer'),
            ),
            const SizedBox(height: 8),
            TharagaiButton(
              label: _demoBusy ? 'Signing in…' : 'Demo admin sign in',
              variant: TharagaiButtonVariant.outline,
              onPressed: _busy || _demoBusy ? null : () => _demoSignIn('staff'),
            ),
          ],
        ],
      ),
    );
  }
}
