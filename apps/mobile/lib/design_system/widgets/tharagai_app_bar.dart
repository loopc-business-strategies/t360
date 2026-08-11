import 'package:flutter/material.dart';
import '../tharagai_colors.dart';

class TharagaiAppBar extends StatelessWidget implements PreferredSizeWidget {
  const TharagaiAppBar({super.key, required this.title});

  final String title;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title,
        style: const TextStyle(
          letterSpacing: 2,
          fontWeight: FontWeight.w600,
        ),
      ),
      backgroundColor: TharagaiColors.ink,
      foregroundColor: TharagaiColors.elevated,
    );
  }
}
