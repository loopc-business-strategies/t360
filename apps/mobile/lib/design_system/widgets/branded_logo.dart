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

  double _heightFor(BuildContext context) {
    final shortest = MediaQuery.sizeOf(context).shortestSide;
    final isTablet = shortest >= 600;
    return switch (variant) {
      BrandedLogoVariant.appBar => isTablet ? 56.0 : 48.0,
      BrandedLogoVariant.hero => isTablet ? 160.0 : 120.0,
    };
  }

  @override
  Widget build(BuildContext context) {
    final height = _heightFor(context);
    return Image.asset(
      _asset,
      height: height,
      fit: BoxFit.contain,
      alignment: alignment,
      semanticLabel: semanticLabel,
      filterQuality: FilterQuality.high,
      errorBuilder: (context, error, stackTrace) => Image.asset(
        'assets/branding/tharagai_logo.png',
        height: height,
        fit: BoxFit.contain,
        alignment: alignment,
        semanticLabel: semanticLabel,
      ),
    );
  }
}
