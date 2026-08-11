import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../../catalog/data/catalog_models.dart';

final homeCategoriesProvider = FutureProvider<List<CategoryDto>>((ref) {
  return ref.watch(catalogRepositoryProvider).categories();
});

final homeProductsProvider = FutureProvider<List<ProductDto>>((ref) {
  return ref.watch(catalogRepositoryProvider).products();
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final cats = ref.watch(homeCategoriesProvider);
    final products = ref.watch(homeProductsProvider);

    return Scaffold(
      appBar: TharagaiAppBar(title: t.brand),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(homeCategoriesProvider);
          ref.invalidate(homeProductsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(t.tagline, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            cats.when(
              data: (list) => SizedBox(
                height: 44,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: list.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final c = list[i];
                    return ActionChip(
                      label: Text(c.name),
                      onPressed: () => context.push('/categories?category=${c.slug}'),
                    );
                  },
                ),
              ),
              loading: () => Text(t.loading),
              error: (e, st) => Text(e.toString()),
            ),
            const SizedBox(height: 24),
            products.when(
              data: (list) {
                if (list.isEmpty) {
                  return Text(t.emptyProducts);
                }
                return Column(
                  children: [
                    for (final p in list) ...[
                      _ProductTile(product: p, addLabel: t.addToCart),
                      const SizedBox(height: 12),
                    ],
                  ],
                );
              },
              loading: () => Center(child: Text(t.loading)),
              error: (e, st) => Column(
                children: [
                  Text(t.errorTitle),
                  Text(e.toString()),
                  TharagaiButton(
                    label: t.retry,
                    onPressed: () => ref.invalidate(homeProductsProvider),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile({required this.product, required this.addLabel});

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
        addToCartLabel: addLabel,
        onAddToCart: () => context.push('/product/${product.slug}'),
      ),
    );
  }
}
