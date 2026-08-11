import 'package:flutter/material.dart';
import '../tharagai_colors.dart';

enum TharagaiButtonVariant { primary, secondary, outline }

class TharagaiButton extends StatelessWidget {
  const TharagaiButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = TharagaiButtonVariant.primary,
  });

  final String label;
  final VoidCallback? onPressed;
  final TharagaiButtonVariant variant;

  @override
  Widget build(BuildContext context) {
    final style = switch (variant) {
      TharagaiButtonVariant.primary => ElevatedButton.styleFrom(
          backgroundColor: TharagaiColors.wine,
          foregroundColor: TharagaiColors.elevated,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          minimumSize: const Size(0, 48),
        ),
      TharagaiButtonVariant.secondary => ElevatedButton.styleFrom(
          backgroundColor: TharagaiColors.teal,
          foregroundColor: TharagaiColors.elevated,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          minimumSize: const Size(0, 48),
        ),
      TharagaiButtonVariant.outline => OutlinedButton.styleFrom(
          foregroundColor: TharagaiColors.ink,
          side: BorderSide(color: TharagaiColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          minimumSize: const Size(0, 48),
        ),
    };

    if (variant == TharagaiButtonVariant.outline) {
      return OutlinedButton(onPressed: onPressed, style: style, child: Text(label));
    }
    return ElevatedButton(onPressed: onPressed, style: style, child: Text(label));
  }
}
