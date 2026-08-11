import 'package:flutter/material.dart';
import '../tharagai_colors.dart';

class TharagaiPrice extends StatelessWidget {
  const TharagaiPrice({
    super.key,
    required this.amount,
    this.compareAt,
    this.currencySymbol = '₹',
  });

  final double amount;
  final double? compareAt;
  final String currencySymbol;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          '$currencySymbol${amount.toStringAsFixed(0)}',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: TharagaiColors.ink,
          ),
        ),
        if (compareAt != null && compareAt! > amount) ...[
          const SizedBox(width: 8),
          Text(
            '$currencySymbol${compareAt!.toStringAsFixed(0)}',
            style: const TextStyle(
              fontSize: 13,
              color: TharagaiColors.muted,
              decoration: TextDecoration.lineThrough,
            ),
          ),
        ],
      ],
    );
  }
}
