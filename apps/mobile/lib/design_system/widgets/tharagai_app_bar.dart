import 'package:flutter/material.dart';
import '../tharagai_colors.dart';
import 'branded_logo.dart';

class TharagaiAppBar extends StatelessWidget implements PreferredSizeWidget {
  const TharagaiAppBar({
    super.key,
    this.title,
    this.showLogo = false,
  }) : assert(title != null || showLogo);

  final String? title;
  final bool showLogo;

  static const double _logoToolbarHeight = 64;

  @override
  Size get preferredSize => Size.fromHeight(
        showLogo ? _logoToolbarHeight : kToolbarHeight,
      );

  @override
  Widget build(BuildContext context) {
    return AppBar(
      toolbarHeight: showLogo ? _logoToolbarHeight : kToolbarHeight,
      title: showLogo
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
      centerTitle: showLogo,
      backgroundColor: TharagaiColors.ink,
      foregroundColor: TharagaiColors.elevated,
    );
  }
}
