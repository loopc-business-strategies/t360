import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_strings.dart';
import '../../../repositories.dart';
import '../../data/catalog_models.dart';
import 'home_product_card.dart';
import 'home_product_dedup.dart';

String? _collectionSlugFromSection(Map<String, dynamic> section) {
  final slug = '${section['collectionSlug'] ?? ''}'.trim();
  if (slug.isNotEmpty) return slug;

  final href = '${section['ctaHref'] ?? ''}'.trim();
  const prefix = '/collections/';
  if (href.startsWith(prefix)) {
    final rest = href.substring(prefix.length).split('?').first;
    if (rest.isNotEmpty) return rest;
  }
  return null;
}

class HomeCampaignSection extends ConsumerStatefulWidget {
  const HomeCampaignSection({
    super.key,
    required this.section,
    this.dedup,
  });

  final Map<String, dynamic> section;
  final HomeProductDedup? dedup;

  @override
  ConsumerState<HomeCampaignSection> createState() => _HomeCampaignSectionState();
}

class _HomeCampaignSectionState extends ConsumerState<HomeCampaignSection> {
  List<ProductDto> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant HomeCampaignSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.section != widget.section) _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final slug = _collectionSlugFromSection(widget.section);
      if (slug == null) {
        if (mounted) {
          setState(() {
            _products = [];
            _loading = false;
          });
        }
        return;
      }

      var list = await ref.read(catalogRepositoryProvider).products(
            collection: slug,
            pageSize: 12,
          );
      if (widget.dedup != null) {
        list = widget.dedup!.claimProducts(list);
      } else {
        list = list.where((p) => !isBannedSareeUrl(p.imageUrl)).toList();
      }

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

  String _bannerUrl() {
    final configured = [
      widget.section['mobileImageUrl'],
      widget.section['imageUrl'],
    ].map((e) => '$e'.trim()).firstWhere((u) => u.isNotEmpty, orElse: () => '');

    if (configured.isNotEmpty && !isBannedSareeUrl(configured)) return configured;

    for (final p in _products) {
      final url = p.imageUrl?.trim();
      if (url != null && url.isNotEmpty && !isBannedSareeUrl(url)) return url;
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final headline = '${widget.section['headline'] ?? ''}'.trim();
    final body =
        '${widget.section['body'] ?? widget.section['subtitle'] ?? ''}'.trim();
    final ctaHref = widget.section['ctaHref']?.toString();
    final ctaLabel = '${widget.section['ctaLabel'] ?? 'Shop'}';
    final bannerUrl = _bannerUrl();

    if (headline.isEmpty && bannerUrl.isEmpty && _products.isEmpty && !_loading) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (bannerUrl.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AspectRatio(
                aspectRatio: 4 / 3,
                child: Image.network(
                  bannerUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(color: TharagaiColors.linen),
                ),
              ),
            ),
          if (bannerUrl.isNotEmpty) const SizedBox(height: 12),
          if (headline.isNotEmpty)
            Text(headline, style: Theme.of(context).textTheme.headlineSmall),
          if (body.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              body,
              style: const TextStyle(color: TharagaiColors.muted, height: 1.4),
            ),
          ],
          if (_loading) ...[
            const SizedBox(height: 16),
            const Center(child: CircularProgressIndicator()),
          ] else if (_products.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 360,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _products.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  return SizedBox(
                    width: 220,
                    child: HomeProductCard(
                      product: _products[i],
                      addLabel: t.addToCart,
                    ),
                  );
                },
              ),
            ),
          ],
          if (ctaHref != null && ctaHref.isNotEmpty) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton(
                onPressed: () {
                  if (ctaHref.startsWith('/')) context.push(ctaHref);
                },
                child: Text(ctaLabel),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
