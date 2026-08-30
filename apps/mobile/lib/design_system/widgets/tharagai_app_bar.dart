import 'package:flutter/material.dart';
import '../tharagai_colors.dart';
import 'branded_logo.dart';
import 'tharagai_wordmark.dart';

class TharagaiAppBar extends StatelessWidget implements PreferredSizeWidget {
  const TharagaiAppBar({
    super.key,
    this.title,
    this.showLogo = false,
    this.showWordmark = false,
  }) : assert(title != null || showLogo || showWordmark);

  final String? title;
  final bool showLogo;
  final bool showWordmark;

  static const double _logoToolbarHeight = 64;

  @override
  Size get preferredSize => Size.fromHeight(
        showLogo || showWordmark ? _logoToolbarHeight : kToolbarHeight,
      );

  @override
  Widget build(BuildContext context) {
    return AppBar(
      toolbarHeight: showLogo || showWordmark ? _logoToolbarHeight : kToolbarHeight,
      title: showWordmark
          ? const TharagaiWordmark()
          : showLogo
              ? BrandedLogo(
                  variant: BrandedLogoVariant.appBar,
                  semanticLabel: title ?? 'Tharagai Fashion',
                )
              : Text(
                  title!,
                  style: const TextStyle(
                    letterSpacing: 2,
                    fontWeight: FontWeight.w600,
                  ),
                ),
      centerTitle: showLogo || showWordmark,
      backgroundColor: TharagaiColors.ink,
      foregroundColor: TharagaiColors.elevated,
    );
  }
}
