import 'package:flutter/material.dart';

import '../../../../design_system/design_system.dart';
import '../../data/catalog_models.dart';

class CatalogProductListTile extends StatelessWidget {
  const CatalogProductListTile({
    super.key,
    required this.product,
    required this.onTap,
  });

  final ProductDto product;
  final VoidCallback onTap;

  static const _placeholderUrl = 'https://placehold.co/160x200/png';

  @override
  Widget build(BuildContext context) {
    final rating = product.averageRating;
    final price = product.salePrice ?? product.price ?? 0;
    final subtitleParts = <String>[
      if (product.brandName != null && product.brandName!.isNotEmpty) product.brandName!,
      if (rating != null) '${rating.toStringAsFixed(1)}★',
    ];

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          product.imageUrl ?? _placeholderUrl,
          width: 72,
          height: 90,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => Container(
            width: 72,
            height: 90,
            color: TharagaiColors.elevated,
            alignment: Alignment.center,
            child: const Icon(Icons.checkroom_outlined, color: TharagaiColors.muted),
          ),
        ),
      ),
      title: Text(
        product.name,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: subtitleParts.isEmpty
          ? null
          : Text(
              subtitleParts.join(' · '),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
      trailing: Text(
        '₹${price.toStringAsFixed(price.truncateToDouble() == price ? 0 : 1)}',
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      onTap: onTap,
    );
  }
}
