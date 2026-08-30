import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

enum BrandSocialPlatform { whatsapp, instagram }

/// Official-style WhatsApp / Instagram glyph via Font Awesome brands.
class BrandSocialIcon extends StatelessWidget {
  const BrandSocialIcon({
    super.key,
    required this.platform,
    this.size = 28,
    this.color = Colors.white,
  });

  final BrandSocialPlatform platform;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final icon = platform == BrandSocialPlatform.whatsapp
        ? FontAwesomeIcons.whatsapp
        : FontAwesomeIcons.instagram;

    return FaIcon(icon, size: size, color: color);
  }
}
