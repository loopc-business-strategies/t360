import 'package:flutter/material.dart';
import '../tharagai_colors.dart';

class TharagaiAppBar extends StatelessWidget implements PreferredSizeWidget {
  const TharagaiAppBar({
    super.key,
    this.title,
    this.showLogo = false,
  }) : assert(title != null || showLogo);

  final String? title;
  final bool showLogo;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: showLogo
          ? Image.asset(
              'assets/branding/tharagai_logo.png',
              height: 36,
              fit: BoxFit.contain,
              semanticLabel: title ?? 'THARAGAI',
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
