import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'widgets/auth_ui.dart';

class WelcomeAuthScreen extends StatelessWidget {
  const WelcomeAuthScreen({super.key, this.redirectTo});

  final String? redirectTo;

  String get _q => authRedirectQuery(redirectTo);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/branding/auth_welcome_bg.jpg',
            fit: BoxFit.cover,
            errorBuilder: (_, error, stackTrace) => Container(color: authInk),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.45),
                  Colors.black.withValues(alpha: 0.55),
                  Colors.black.withValues(alpha: 0.85),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(28, 24, 28, 20),
              child: Column(
                children: [
                  const AuthBrandLogo(height: 140, onDark: true),
                  const Spacer(flex: 2),
                  Text.rich(
                    TextSpan(
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w600,
                        height: 1.25,
                      ),
                      children: const [
                        TextSpan(text: 'Welcome to '),
                        TextSpan(
                          text: 'Tharagai Fashion',
                          style: TextStyle(color: authGold),
                        ),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Your style. Your way. Anytime. Anywhere.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _Dot(active: true),
                      const SizedBox(width: 6),
                      _Dot(active: false),
                      const SizedBox(width: 6),
                      _Dot(active: false),
                    ],
                  ),
                  const Spacer(flex: 2),
                  AuthGoldButton(
                    label: 'Login',
                    onPressed: () => context.push('/auth/login$_q'),
                  ),
                  const SizedBox(height: 12),
                  AuthOutlineGoldButton(
                    label: 'Sign Up',
                    onPressed: () => context.push('/auth/signup$_q'),
                  ),
                  const SizedBox(height: 28),
                  const AuthSocialRow(),
                  const SizedBox(height: 20),
                  const AuthTermsText(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: active ? 8 : 6,
      height: active ? 8 : 6,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: active ? authGold : Colors.white.withValues(alpha: 0.35),
      ),
    );
  }
}
