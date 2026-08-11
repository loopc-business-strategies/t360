import 'package:flutter/material.dart';
import '../tharagai_colors.dart';
import 'tharagai_button.dart';
import 'tharagai_card.dart';
import 'tharagai_price.dart';

class TharagaiProductCard extends StatelessWidget {
  const TharagaiProductCard({
    super.key,
    required this.name,
    required this.imageUrl,
    required this.price,
    required this.addToCartLabel,
    this.brand,
    this.compareAt,
    this.onAddToCart,
  });

  final String name;
  final String? brand;
  final String imageUrl;
  final double price;
  final double? compareAt;
  final String addToCartLabel;
  final VoidCallback? onAddToCart;

  @override
  Widget build(BuildContext context) {
    return TharagaiCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: AspectRatio(
              aspectRatio: 4 / 5,
              child: Image.network(imageUrl, fit: BoxFit.cover),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (brand != null)
                  Text(
                    brand!,
                    style: const TextStyle(
                      color: TharagaiColors.muted,
                      fontSize: 12,
                      letterSpacing: 0.6,
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: TharagaiColors.ink,
                  ),
                ),
                const SizedBox(height: 8),
                TharagaiPrice(amount: price, compareAt: compareAt),
                const SizedBox(height: 12),
                TharagaiButton(label: addToCartLabel, onPressed: onAddToCart),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
