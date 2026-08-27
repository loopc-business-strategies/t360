import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'tharagai_colors.dart';

class TharagaiTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
    );

    final figtree = GoogleFonts.figtreeTextTheme(base.textTheme);
    final display = GoogleFonts.newsreaderTextTheme(base.textTheme);

    return base.copyWith(
      scaffoldBackgroundColor: TharagaiColors.linen,
      colorScheme: ColorScheme.light(
        primary: TharagaiColors.wine,
        secondary: TharagaiColors.teal,
        tertiary: TharagaiColors.brass,
        surface: TharagaiColors.elevated,
        error: TharagaiColors.danger,
        onPrimary: TharagaiColors.elevated,
        onSecondary: TharagaiColors.elevated,
        onSurface: TharagaiColors.ink,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: TharagaiColors.elevated,
        foregroundColor: TharagaiColors.ink,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.newsreader(
          fontSize: 20,
          fontWeight: FontWeight.w500,
          color: TharagaiColors.ink,
          letterSpacing: 1.6,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: TharagaiColors.elevated,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: TharagaiColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: TharagaiColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: TharagaiColors.wine, width: 1.5),
        ),
      ),
      textTheme: figtree.apply(
        bodyColor: TharagaiColors.ink,
        displayColor: TharagaiColors.ink,
      ).copyWith(
        headlineLarge: display.headlineLarge?.copyWith(
          fontFamily: GoogleFonts.newsreader().fontFamily,
          fontWeight: FontWeight.w500,
        ),
        headlineMedium: display.headlineMedium?.copyWith(
          fontFamily: GoogleFonts.newsreader().fontFamily,
          fontWeight: FontWeight.w500,
        ),
        headlineSmall: display.headlineSmall?.copyWith(
          fontFamily: GoogleFonts.newsreader().fontFamily,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
