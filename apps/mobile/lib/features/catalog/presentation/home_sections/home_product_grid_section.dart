import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_strings.dart';
import '../../../repositories.dart';
import '../../data/catalog_models.dart';

import 'home_product_dedup.dart';

/// Shared query parsing for storefront product sections.
Map<String, dynamic> parseSectionQuery(Map<String, dynamic> section) {
  return section['query'] is Map
      ? Map<String, dynamic>.from(section['query'] as Map)
      : <String, dynamic>{};
}

Future<List<ProductDto>> loadSectionProducts(
  WidgetRef ref,
  Map<String, dynamic> section, {
  int pageSize = 12,
  int page = 1,
}) async {
  final query = parseSectionQuery(section);
  return ref.read(catalogRepositoryProvider).products(
        category: query['categorySlug']?.toString(),
        collection: query['collectionSlug']?.toString(),
        sort: query['sort']?.toString(),
        tryOnEnabled: query['tryOnOnly'] == true,
        isNew: query['isNew'] == true,
        isTrending: query['isTrending'] == true,
        isBestseller: query['isBestseller'] == true,
        isFeatured: query['isFeatured'] == true,
        onSale: query['onSale'] == true,
        page: page,
        pageSize: pageSize,
      );
}

String sectionViewAllHref(Map<String, dynamic> section) {
  final query = parseSectionQuery(section);
  final params = <String, String>{};
  if (query['categorySlug'] != null) {
    params['category'] = '${query['categorySlug']}';
  }
  if (query['collectionSlug'] != null) {
    params['collection'] = '${query['collectionSlug']}';
  }
  if (query['sort'] != null) params['sort'] = '${query['sort']}';
  if (query['isNew'] == true) params['isNew'] = 'true';
  if (query['isTrending'] == true) params['isTrending'] = 'true';
  if (query['onSale'] == true) params['onSale'] = 'true';
  if (params.isEmpty) return '/categories';
  return Uri(path: '/categories', queryParameters: params).toString();
}

class HomeProductGridSection extends ConsumerStatefulWidget {
  const HomeProductGridSection({super.key, required this.section, required this.dedup});

  final Map<String, dynamic> section;
  final HomeProductDedup dedup;

  @override
  ConsumerState<HomeProductGridSection> createState() => _HomeProductGridSectionState();
}

class _HomeProductGridSectionState extends ConsumerState<HomeProductGridSection> {
  List<ProductDto> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant HomeProductGridSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.section != widget.section) _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await loadSectionProducts(ref, widget.section);
      if (!mounted) return;
      setState(() {
        _products = widget.dedup.claimProducts(list);
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _products = [];
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final title = '${widget.section['title'] ?? t.shop}';
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_products.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title, style: Theme.of(context).textTheme.titleLarge),
              ),
              TextButton(
                onPressed: () => context.push(sectionViewAllHref(widget.section)),
                child: Text(t.shop),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.58,
            ),
            itemCount: _products.length,
            itemBuilder: (context, i) => HomeGridProductCard(
              product: _products[i],
              addLabel: t.addToCart,
            ),
          ),
        ],
      ),
    );
  }
}

class HomeBrowseAllSection extends ConsumerStatefulWidget {
  const HomeBrowseAllSection({super.key, required this.dedup});

  final HomeProductDedup dedup;

  @override
  ConsumerState<HomeBrowseAllSection> createState() => _HomeBrowseAllSectionState();
}

class _HomeBrowseAllSectionState extends ConsumerState<HomeBrowseAllSection> {
  final List<ProductDto> _products = [];
  int _page = 1;
  bool _loading = false;
  bool _hasMore = true;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _loadMore(initial: true);
  }

  Future<void> _loadMore({bool initial = false}) async {
    if (_loading || (!_hasMore && !initial)) return;
    setState(() => _loading = true);
    try {
      final list = await ref.read(catalogRepositoryProvider).products(
            sort: 'newest',
            page: _page,
            pageSize: 40,
          );
      if (!mounted) return;
      setState(() {
        _products.addAll(widget.dedup.claimProducts(list));
        _page++;
        _hasMore = list.length >= 40;
        _loading = false;
        _initialized = true;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _initialized = true;
          _hasMore = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    if (_initialized && _products.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Browse All', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          if (!_initialized && _loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.58,
              ),
              itemCount: _products.length,
              itemBuilder: (context, i) => HomeGridProductCard(
                product: _products[i],
                addLabel: t.addToCart,
              ),
            ),
          if (_hasMore) ...[
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _loading ? null : _loadMore,
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Load more'),
            ),
          ],
        ],
      ),
    );
  }
}

class HomeGridProductCard extends StatelessWidget {
  const HomeGridProductCard({
    super.key,
    required this.product,
    required this.addLabel,
  });

  final ProductDto product;
  final String addLabel;

  @override
  Widget build(BuildContext context) {
    final price = product.salePrice ?? product.price ?? 0;
    final compare = product.salePrice != null ? product.price : null;

    return InkWell(
      onTap: () => context.push('/product/${product.slug}'),
      borderRadius: BorderRadius.circular(12),
      child: TharagaiCard(
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: Image.network(
                  product.imageUrl ?? 'https://placehold.co/400x500/png',
                  fit: BoxFit.cover,
                  width: double.infinity,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: TharagaiColors.ink,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TharagaiPrice(amount: price, compareAt: compare),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
