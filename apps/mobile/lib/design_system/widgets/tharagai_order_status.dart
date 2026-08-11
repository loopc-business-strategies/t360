import 'package:flutter/material.dart';
import '../tharagai_colors.dart';

enum TharagaiOrderStatusCode {
  pending,
  confirmed,
  packed,
  readyForPickup,
  delivered,
  cancelled,
}

class TharagaiOrderStatus extends StatelessWidget {
  const TharagaiOrderStatus({
    super.key,
    required this.status,
    required this.label,
  });

  final TharagaiOrderStatusCode status;
  final String label;

  Color get _bg {
    return switch (status) {
      TharagaiOrderStatusCode.pending => TharagaiColors.brass.withValues(alpha: 0.2),
      TharagaiOrderStatusCode.confirmed => TharagaiColors.teal.withValues(alpha: 0.15),
      TharagaiOrderStatusCode.packed => TharagaiColors.wine.withValues(alpha: 0.12),
      TharagaiOrderStatusCode.readyForPickup => TharagaiColors.wine.withValues(alpha: 0.12),
      TharagaiOrderStatusCode.delivered => TharagaiColors.success.withValues(alpha: 0.12),
      TharagaiOrderStatusCode.cancelled => TharagaiColors.danger.withValues(alpha: 0.12),
    };
  }

  Color get _fg {
    return switch (status) {
      TharagaiOrderStatusCode.pending => TharagaiColors.ink,
      TharagaiOrderStatusCode.confirmed => TharagaiColors.teal,
      TharagaiOrderStatusCode.packed => TharagaiColors.wine,
      TharagaiOrderStatusCode.readyForPickup => TharagaiColors.wine,
      TharagaiOrderStatusCode.delivered => TharagaiColors.success,
      TharagaiOrderStatusCode.cancelled => TharagaiColors.danger,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: _fg,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
