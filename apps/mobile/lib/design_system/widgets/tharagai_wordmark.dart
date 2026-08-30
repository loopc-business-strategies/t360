import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../tharagai_colors.dart';

/// Text wordmark for app bar and dark surfaces.
class TharagaiWordmark extends StatelessWidget {
  const TharagaiWordmark({
    super.key,
    this.fontSize = 24,
    this.color = TharagaiColors.brass,
  });

  final double fontSize;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Text(
      'Tharagai',
      style: GoogleFonts.playfairDisplay(
        fontSize: fontSize,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.4,
        color: color,
        height: 1.1,
      ),
    );
  }
}
