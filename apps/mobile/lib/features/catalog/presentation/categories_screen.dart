import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/catalog_models.dart';

final categoriesListProvider = FutureProvider<List<CategoryDto>>((ref) {
  return ref.watch(catalogRepositoryProvider).categories();
});

final categoryProductsProvider =
    FutureProvider.family<List<ProductDto>, ({String? category, String? collection})>((ref, filter) {
  return ref.watch(catalogRepositoryProvider).products(
        category: filter.category,
        collection: filter.collection,
      );
});

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key, this.initialCategory, this.initialCollection});

  final String? initialCategory;
  final String? initialCollection;

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  String? _category;
  String? _collection;
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _category = widget.initialCategory;
    _collection = widget.initialCollection;
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final cats = ref.watch(categoriesListProvider);
    final products = ref.watch(
      categoryProductsProvider((category: _category, collection: _collection)),
    );

    return Scaffold(
      appBar: TharagaiAppBar(title: t.categories),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TharagaiInput(
                    label: t.search,
                    controller: _search,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                TharagaiButton(
                  label: t.search,
                  onPressed: () {
                    ref.invalidate(
                      categoryProductsProvider((category: _category, collection: _collection)),
                    );
                  },
                ),
              ],
            ),
          ),
          if (_collection != null && _collection!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: InputChip(
                  label: Text('Collection: $_collection'),
                  onDeleted: () => setState(() => _collection = null),
                ),
              ),
            ),
          cats.when(
            data: (list) => SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(t.categories),
                      selected: _category == null,
                      onSelected: (_) => setState(() => _category = null),
                    ),
                  ),
                  for (final c in list)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(c.name),
                        selected: _category == c.slug,
                        onSelected: (_) => setState(() => _category = c.slug),
                      ),
                    ),
                ],
              ),
            ),
            loading: () => const SizedBox.shrink(),
            error: (e, st) => const SizedBox.shrink(),
          ),
          Expanded(
            child: products.when(
              data: (list) {
                final q = _search.text.trim().toLowerCase();
                final filtered = q.isEmpty
                    ? list
                    : list.where((p) => p.name.toLowerCase().contains(q)).toList();
                if (filtered.isEmpty) {
                  return Center(child: Text(t.emptyProducts));
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) {
                    final p = filtered[i];
                    final rating = p.averageRating;
                    return ListTile(
                      title: Text(p.name),
                      subtitle: Text(
                        [
                          if (p.brandName != null && p.brandName!.isNotEmpty) p.brandName!,
                          if (rating != null) '${rating.toStringAsFixed(1)}★',
                        ].join(' · '),
                      ),
                      trailing: Text(
                        '₹${p.salePrice ?? p.price ?? 0}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      onTap: () => context.push('/product/${p.slug}'),
                    );
                  },
                );
              },
              loading: () => Center(child: Text(t.loading)),
              error: (e, _) => Center(child: Text(e.toString())),
            ),
          ),
        ],
      ),
    );
  }
}
