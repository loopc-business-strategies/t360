import 'package:flutter/material.dart';
import 'tharagai_colors.dart';

class TharagaiTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: 'Roboto',
    );

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
      appBarTheme: const AppBarTheme(
        backgroundColor: TharagaiColors.ink,
        foregroundColor: TharagaiColors.elevated,
        elevation: 0,
        centerTitle: false,
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
      textTheme: base.textTheme.apply(
        bodyColor: TharagaiColors.ink,
        displayColor: TharagaiColors.ink,
      ),
    );
  }
}
