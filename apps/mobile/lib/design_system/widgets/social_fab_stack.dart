import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env.dart';
import 'brand_social_icon.dart';

/// Sticky WhatsApp + Instagram floating action buttons (matches web SocialFabs).
class SocialFabStack extends StatelessWidget {
  const SocialFabStack({super.key});

  Future<void> _open(BuildContext context, Uri uri) async {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open link')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final wa = AppEnv.configuredWhatsAppE164;
    final ig = AppEnv.configuredInstagramUrl;
    if (wa == null && ig == null) return const SizedBox.shrink();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (wa != null)
          _FabButton(
            tooltip: 'Chat on WhatsApp',
            background: const Color(0xFF25D366),
            onTap: () => _open(
              context,
              Uri.parse(
                'https://wa.me/$wa?text=${Uri.encodeComponent('Hi, I have a question about THARAGAI products.')}',
              ),
            ),
            child: const BrandSocialIcon(
              platform: BrandSocialPlatform.whatsapp,
              size: 28,
            ),
          ),
        if (wa != null && ig != null) const SizedBox(height: 12),
        if (ig != null)
          _FabButton(
            tooltip: 'Follow on Instagram',
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFFFDF497),
                Color(0xFFFD5949),
                Color(0xFFD6249F),
                Color(0xFF285AEB),
              ],
              stops: [0.0, 0.45, 0.6, 0.9],
            ),
            onTap: () => _open(context, Uri.parse(ig)),
            child: const BrandSocialIcon(
              platform: BrandSocialPlatform.instagram,
              size: 28,
            ),
          ),
      ],
    );
  }
}

class _FabButton extends StatelessWidget {
  const _FabButton({
    required this.tooltip,
    required this.onTap,
    required this.child,
    this.background,
    this.gradient,
  });

  final String tooltip;
  final VoidCallback onTap;
  final Widget child;
  final Color? background;
  final Gradient? gradient;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: background ?? Colors.transparent,
        shape: const CircleBorder(),
        elevation: 4,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Ink(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: gradient,
              color: gradient == null ? background : null,
            ),
            child: Center(child: child),
          ),
        ),
      ),
    );
  }
}
