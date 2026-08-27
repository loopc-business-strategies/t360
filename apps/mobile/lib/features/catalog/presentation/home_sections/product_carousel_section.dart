import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_strings.dart';
import '../../../repositories.dart';
import '../../data/catalog_models.dart';
import 'home_product_card.dart';

class HomeProductCarouselSection extends ConsumerStatefulWidget {
  const HomeProductCarouselSection({super.key, required this.section});

  final Map<String, dynamic> section;

  @override
  ConsumerState<HomeProductCarouselSection> createState() =>
      _HomeProductCarouselSectionState();
}

class _HomeProductCarouselSectionState extends ConsumerState<HomeProductCarouselSection> {
  List<ProductDto> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant HomeProductCarouselSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.section != widget.section) _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final query = widget.section['query'] is Map
          ? Map<String, dynamic>.from(widget.section['query'] as Map)
          : <String, dynamic>{};
      final list = await ref.read(catalogRepositoryProvider).products(
            category: query['categorySlug']?.toString(),
            collection: query['collectionSlug']?.toString(),
            sort: query['sort']?.toString(),
            tryOnEnabled: query['tryOnOnly'] == true,
            pageSize: 8,
          );
      if (!mounted) return;
      setState(() {
        _products = list;
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
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: Text(title, style: Theme.of(context).textTheme.titleLarge),
                ),
                TextButton(
                  onPressed: () => context.push('/categories'),
                  child: Text(t.shop),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 360,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: _products.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                final p = _products[i];
                return SizedBox(
                  width: 220,
                  child: HomeProductCard(product: p, addLabel: t.addToCart),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
