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
    this.secondImageUrl,
    this.tryOnEnabled = false,
    this.tryMeLabel = 'TRY ME',
    this.averageRating,
    this.onAddToCart,
    this.onTryMe,
    this.onWishlist,
    this.wishlisted = false,
  });

  final String name;
  final String? brand;
  final String imageUrl;
  final String? secondImageUrl;
  final double price;
  final double? compareAt;
  final String addToCartLabel;
  final bool tryOnEnabled;
  final String tryMeLabel;
  final double? averageRating;
  final bool wishlisted;
  final VoidCallback? onAddToCart;
  final VoidCallback? onTryMe;
  final VoidCallback? onWishlist;

  @override
  Widget build(BuildContext context) {
    final onSale = compareAt != null && compareAt! > price;

    return TharagaiCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: AspectRatio(
                  aspectRatio: 4 / 5,
                  child: Image.network(imageUrl, fit: BoxFit.cover),
                ),
              ),
              if (onSale)
                Positioned(
                  left: 12,
                  top: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    color: TharagaiColors.wine,
                    child: const Text(
                      'SALE',
                      style: TextStyle(color: TharagaiColors.elevated, fontSize: 10, letterSpacing: 1),
                    ),
                  ),
                ),
              if (onWishlist != null)
                Positioned(
                  right: 8,
                  top: 8,
                  child: IconButton(
                    onPressed: onWishlist,
                    icon: Icon(
                      wishlisted ? Icons.favorite : Icons.favorite_border,
                      color: TharagaiColors.wine,
                    ),
                  ),
                ),
              if (tryOnEnabled)
                Positioned(
                  left: 12,
                  bottom: 12,
                  child: TextButton(
                    onPressed: onTryMe,
                    style: TextButton.styleFrom(
                      backgroundColor: TharagaiColors.elevated.withValues(alpha: 0.95),
                      foregroundColor: TharagaiColors.wine,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(tryMeLabel, style: const TextStyle(fontSize: 11, letterSpacing: 1.2)),
                  ),
                ),
            ],
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
                if (averageRating != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 14, color: TharagaiColors.brass),
                      const SizedBox(width: 4),
                      Text(
                        averageRating!.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 13,
                          color: TharagaiColors.muted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
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
