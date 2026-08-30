import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env.dart';
import '../tharagai_colors.dart';
import 'brand_social_icon.dart';

/// WhatsApp + Instagram icon buttons that open external apps/browser.
class SocialConnectRow extends StatelessWidget {
  const SocialConnectRow({super.key, this.title = 'Connect with us'});

  final String title;

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
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: TharagaiColors.muted,
              ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (wa != null) ...[
              _SocialIconButton(
                tooltip: 'WhatsApp',
                background: const Color(0xFF25D366),
                onPressed: () => _open(
                  context,
                  Uri.parse(
                    'https://wa.me/$wa?text=${Uri.encodeComponent('Hi, I have a question about THARAGAI products.')}',
                  ),
                ),
                child: const BrandSocialIcon(
                  platform: BrandSocialPlatform.whatsapp,
                  size: 26,
                ),
              ),
              if (ig != null) const SizedBox(width: 16),
            ],
            if (ig != null)
              _SocialIconButton(
                tooltip: 'Instagram',
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
                onPressed: () => _open(context, Uri.parse(ig)),
                child: const BrandSocialIcon(
                  platform: BrandSocialPlatform.instagram,
                  size: 26,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _SocialIconButton extends StatelessWidget {
  const _SocialIconButton({
    required this.tooltip,
    required this.onPressed,
    required this.child,
    this.background,
    this.gradient,
  });

  final String tooltip;
  final Color? background;
  final Gradient? gradient;
  final VoidCallback onPressed;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: background ?? Colors.transparent,
        shape: const CircleBorder(),
        elevation: 2,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed,
          child: Ink(
            width: 52,
            height: 52,
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
