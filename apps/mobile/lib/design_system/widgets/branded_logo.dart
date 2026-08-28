import 'package:flutter/material.dart';

enum BrandedLogoVariant { appBar, hero }

/// Transparent-background logo for dark surfaces (app bar, hero).
class BrandedLogo extends StatelessWidget {
  const BrandedLogo({
    super.key,
    required this.variant,
    this.semanticLabel,
    this.alignment = Alignment.center,
  });

  final BrandedLogoVariant variant;
  final String? semanticLabel;
  final Alignment alignment;

  static const _asset = 'assets/branding/tharagai_logo_transparent.png';

  double get _height => switch (variant) {
        BrandedLogoVariant.appBar => 52,
        BrandedLogoVariant.hero => 140,
      };

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      _asset,
      height: _height,
      fit: BoxFit.contain,
      alignment: alignment,
      semanticLabel: semanticLabel,
      filterQuality: FilterQuality.high,
      errorBuilder: (context, error, stackTrace) => Image.asset(
        'assets/branding/tharagai_logo.png',
        height: _height,
        fit: BoxFit.contain,
        alignment: alignment,
        semanticLabel: semanticLabel,
      ),
    );
  }
}
