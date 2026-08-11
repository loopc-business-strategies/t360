import 'package:flutter/material.dart';
import '../tharagai_colors.dart';

class TharagaiCard extends StatelessWidget {
  const TharagaiCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: TharagaiColors.elevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: TharagaiColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}
