import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../../catalog/data/catalog_models.dart';

final tryOnProductsProvider = FutureProvider<List<ProductDto>>((ref) {
  return ref.watch(catalogRepositoryProvider).products(tryOnEnabled: true);
});

/// Customer TRY ME hub — recent try-ons + try-on enabled carousel.
class TryMeHubScreen extends ConsumerWidget {
  const TryMeHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final products = ref.watch(tryOnProductsProvider);

    return Scaffold(
      appBar: TharagaiAppBar(title: t.tryMeTab),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(t.tryMeTitle, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(t.tryMeGuide),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () => context.push('/try-ons'),
            child: Text(t.tryMeHistory),
          ),
          const SizedBox(height: 32),
          Text(t.shop, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          products.when(
            data: (items) {
              if (items.isEmpty) {
                return Text(t.emptyProducts);
              }
              return SizedBox(
                height: 320,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final p = items[index];
                    final price = p.salePrice ?? p.price ?? 0;
                    return SizedBox(
                      width: 180,
                      child: TharagaiProductCard(
                        name: p.name,
                        brand: p.brandName,
                        imageUrl: p.imageUrl ??
                            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
                        price: price,
                        compareAt: p.salePrice != null ? p.price : null,
                        addToCartLabel: t.addToCart,
                        tryOnEnabled: p.tryOnEnabled,
                        tryMeLabel: t.tryMeTab,
                        onTryMe: () => context.push(
                          '/try-on?productId=${p.id}&name=${Uri.encodeComponent(p.name)}&slug=${p.slug}&tryOnEnabled=1',
                        ),
                        onAddToCart: () => context.push('/product/${p.slug}'),
                      ),
                    );
                  },
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => Text(t.errorTitle),
          ),
        ],
      ),
    );
  }
}
