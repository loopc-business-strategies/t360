import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../../repositories.dart';
import '../data/phone_normalize.dart';
import 'auth_screen.dart';
import 'widgets/auth_ui.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.redirectTo});

  final String? redirectTo;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _mobile = TextEditingController(text: '+91');
  final _otp = TextEditingController();
  var _otpSent = false;
  var _busy = false;
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
      _mobile.text = normalized;
      final res = await ref.read(authRepositoryProvider).requestOtp(normalized);
      if (res.devOtp != null && res.devOtp!.isNotEmpty) {
        _otp.text = res.devOtp!;
        _devOtpHint = 'Staging code: ${res.devOtp}';
      }
      setState(() {
        _otpSent = true;
        _resendIn = 30;
      });
      _tickResend();
    } catch (e) {
      setState(() => _error = mapAuthError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
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
      if (tokens.isNewCustomer) {
        context.go(
          '/account/complete-profile${authRedirectQuery(widget.redirectTo ?? '/')}',
        );
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: authCream,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back_ios_new, size: 20),
                color: authInk,
              ),
            ),
            const AuthBrandLogo(height: 120),
            const SizedBox(height: 20),
            const Text(
              'Welcome back',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: authInk,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Sign in with your mobile number and OTP.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: authInk.withValues(alpha: 0.55),
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 28),
            AuthIconField(
              controller: _mobile,
              hint: 'Mobile Number',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              enabled: !_otpSent,
            ),
            if (_otpSent) ...[
              const SizedBox(height: 12),
              AuthIconField(
                controller: _otp,
                hint: 'Enter OTP',
                icon: Icons.lock_outline,
                keyboardType: TextInputType.number,
              ),
            ],
            if (_devOtpHint != null) ...[
              const SizedBox(height: 12),
              Material(
                color: authGold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    _devOtpHint!,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: authInk,
                    ),
                  ),
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: Color(0xFF9B1C1C), fontSize: 13),
              ),
            ],
            const SizedBox(height: 24),
            AuthGoldButton(
              label: _otpSent ? 'Verify OTP' : 'Send OTP',
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
                child: Text(
                  _resendIn > 0 ? 'Resend in ${_resendIn}s' : 'Resend OTP',
                  style: const TextStyle(color: authGold),
                ),
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
                child: Text(
                  'Change number',
                  style: TextStyle(color: authInk.withValues(alpha: 0.6)),
                ),
              ),
            ],
            const SizedBox(height: 20),
            const AuthSocialRow(light: true),
            const SizedBox(height: 24),
            Center(
              child: Text.rich(
                TextSpan(
                  style: TextStyle(
                    color: authInk.withValues(alpha: 0.6),
                    fontSize: 14,
                  ),
                  children: [
                    const TextSpan(text: "Don't have an account? "),
                    WidgetSpan(
                      alignment: PlaceholderAlignment.baseline,
                      baseline: TextBaseline.alphabetic,
                      child: GestureDetector(
                        onTap: () => context.pushReplacement(
                          '/auth/signup${authRedirectQuery(widget.redirectTo)}',
                        ),
                        child: const Text(
                          'Sign Up',
                          style: TextStyle(
                            color: authGold,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
