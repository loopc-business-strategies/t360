import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';
import '../../data/catalog_models.dart';

class HomeProductCard extends StatelessWidget {
  const HomeProductCard({super.key, required this.product, required this.addLabel});

  final ProductDto product;
  final String addLabel;

  @override
  Widget build(BuildContext context) {
    final price = product.salePrice ?? product.price ?? 0;
    final compare = product.salePrice != null ? product.price : null;
    return InkWell(
      onTap: () => context.push('/product/${product.slug}'),
      child: TharagaiProductCard(
        name: product.name,
        brand: product.brandName,
        imageUrl: product.imageUrl ?? 'https://placehold.co/400x500/png',
        price: price,
        compareAt: compare,
        averageRating: product.averageRating,
        addToCartLabel: addLabel,
        tryOnEnabled: product.tryOnEnabled,
        onAddToCart: () => context.push('/product/${product.slug}'),
        onTryMe: product.tryOnEnabled
            ? () => context.push(
                  '/try-on?productId=${product.id}&name=${Uri.encodeComponent(product.name)}&slug=${product.slug}',
                )
            : null,
      ),
    );
  }
}
