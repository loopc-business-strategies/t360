import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Gold used for auth CTAs (matches mock ~#C9A227 / brass).
const Color authGold = Color(0xFFC9A227);
const Color authGoldDark = Color(0xFFA8841F);
const Color authCream = Color(0xFFF9F6F1);
const Color authInk = Color(0xFF14110F);

const String kAuthPrivacyUrl = 'https://t360-web.vercel.app/policies/privacy';
const String kAuthTermsUrl = 'https://t360-web.vercel.app/policies/terms';

Future<void> openAuthPolicyUrl(String url) async {
  final uri = Uri.parse(url);
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

class AuthGoldButton extends StatelessWidget {
  const AuthGoldButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: enabled
                ? const [Color(0xFFE0C25A), authGold, authGoldDark]
                : const [Color(0xFFB0A88A), Color(0xFF9A9278)],
          ),
          boxShadow: enabled
              ? [
                  BoxShadow(
                    color: authGold.withValues(alpha: 0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(12),
            child: Center(
              child: Text(
                label.toUpperCase(),
                style: TextStyle(
                  color: enabled ? authInk : authInk.withValues(alpha: 0.5),
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AuthOutlineGoldButton extends StatelessWidget {
  const AuthOutlineGoldButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: authGold,
          side: const BorderSide(color: authGold, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
            fontSize: 15,
          ),
        ),
      ),
    );
  }
}

class AuthIconField extends StatelessWidget {
  const AuthIconField({
    super.key,
    required this.controller,
    required this.hint,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      enabled: enabled,
      style: const TextStyle(color: authInk, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: authInk.withValues(alpha: 0.45)),
        prefixIcon: Icon(icon, color: authInk.withValues(alpha: 0.55), size: 22),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: authGold, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
      ),
    );
  }
}

class AuthBrandLogo extends StatelessWidget {
  const AuthBrandLogo({super.key, this.height = 96, this.onDark = false});

  final double height;
  /// Kept for call-site compatibility; gold-on-black logo needs no plate.
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/branding/tharagai_logo.png',
      height: height,
      fit: BoxFit.contain,
      semanticLabel: 'THARAGAI Fashion',
    );
  }
}

class AuthSocialRow extends StatelessWidget {
  const AuthSocialRow({
    super.key,
    this.dividerLabel = 'OR CONTINUE WITH',
    this.light = false,
  });

  final String dividerLabel;
  final bool light;

  void _comingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Social sign-in coming soon')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dividerColor = light ? Colors.grey.shade300 : Colors.white.withValues(alpha: 0.35);
    final labelColor = light ? authInk.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.7);

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: Divider(color: dividerColor)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                dividerLabel,
                style: TextStyle(
                  color: labelColor,
                  fontSize: 11,
                  letterSpacing: 1.1,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Expanded(child: Divider(color: dividerColor)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _SocialCircle(
              onTap: () => _comingSoon(context),
              child: const Text(
                'G',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  color: Color(0xFF4285F4),
                ),
              ),
            ),
            const SizedBox(width: 16),
            _SocialCircle(
              onTap: () => _comingSoon(context),
              color: const Color(0xFF1877F2),
              child: const Icon(Icons.facebook, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 16),
            _SocialCircle(
              onTap: () => _comingSoon(context),
              child: const Icon(Icons.apple, color: Colors.black, size: 24),
            ),
          ],
        ),
      ],
    );
  }
}

class _SocialCircle extends StatelessWidget {
  const _SocialCircle({
    required this.onTap,
    required this.child,
    this.color = Colors.white,
  });

  final VoidCallback onTap;
  final Widget child;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      elevation: 1,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(width: 48, height: 48, child: Center(child: child)),
      ),
    );
  }
}

class AuthTermsText extends StatelessWidget {
  const AuthTermsText({
    super.key,
    this.light = false,
    this.prefix = 'By continuing, you agree to our ',
  });

  final bool light;
  final String prefix;

  @override
  Widget build(BuildContext context) {
    final base = light
        ? authInk.withValues(alpha: 0.55)
        : Colors.white.withValues(alpha: 0.7);
    final linkStyle = TextStyle(
      fontSize: 11,
      color: authGold,
      fontWeight: FontWeight.w600,
      decoration: TextDecoration.underline,
      decorationColor: authGold,
    );
    return Text.rich(
      TextSpan(
        style: TextStyle(fontSize: 11, height: 1.4, color: base),
        children: [
          TextSpan(text: prefix),
          WidgetSpan(
            alignment: PlaceholderAlignment.baseline,
            baseline: TextBaseline.alphabetic,
            child: GestureDetector(
              onTap: () => openAuthPolicyUrl(kAuthTermsUrl),
              child: Text('Terms of Service', style: linkStyle),
            ),
          ),
          const TextSpan(text: ' and '),
          WidgetSpan(
            alignment: PlaceholderAlignment.baseline,
            baseline: TextBaseline.alphabetic,
            child: GestureDetector(
              onTap: () => openAuthPolicyUrl(kAuthPrivacyUrl),
              child: Text('Privacy Policy', style: linkStyle),
            ),
          ),
          const TextSpan(text: '.'),
        ],
      ),
      textAlign: TextAlign.center,
    );
  }
}

String authRedirectQuery(String? redirectTo) {
  if (redirectTo == null || redirectTo.isEmpty) return '';
  return '?redirect=${Uri.encodeComponent(redirectTo)}';
}
