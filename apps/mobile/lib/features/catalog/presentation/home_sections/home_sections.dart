import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/catalog_models.dart';
import 'announcement_section.dart';
import 'category_grid_section.dart';
import 'collection_section.dart';
import 'editorial_section.dart';
import 'hero_campaign_section.dart';
import 'hero_section.dart';
import 'home_product_grid_section.dart';
import 'home_product_dedup.dart';
import 'try_me_promo_section.dart';

export 'announcement_section.dart';
export 'category_grid_section.dart';
export 'collection_section.dart';
export 'editorial_section.dart';
export 'hero_campaign_section.dart';
export 'hero_section.dart';
export 'home_product_dedup.dart';
export 'home_product_grid_section.dart';
export 'product_carousel_section.dart';
export 'try_me_promo_section.dart';

Map<String, dynamic> _editorialSection(Map<String, dynamic> section) {
  return {
    ...section,
    'headline': section['headline'] ?? section['title'],
    'body': section['body'] ?? section['subtitle'],
    'ctaLabel': section['ctaLabel'],
    'ctaHref': section['ctaHref'],
    'imageUrl': section['imageUrl'],
  };
}

class HomeSectionRenderer extends ConsumerWidget {
  const HomeSectionRenderer({
    super.key,
    required this.section,
    required this.storefront,
    required this.categories,
    required this.index,
    required this.dedup,
  });

  final Map<String, dynamic> section;
  final Map<String, dynamic> storefront;
  final List<CategoryDto> categories;
  final int index;
  final HomeProductDedup dedup;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final type = '${section['type'] ?? ''}';
    switch (type) {
      case 'announcement':
        return HomeAnnouncementSection(section: section);
      case 'hero':
        return HomeHeroSection(storefront: storefront);
      case 'heroCampaign':
        return HomeHeroCampaignSection(section: section, storefront: storefront);
      case 'categoryGrid':
      case 'shopByCategory':
        return HomeCategoryGridSection(
          section: {
            ...section,
            if (section['categorySlugs'] != null) 'categorySlugs': section['categorySlugs'],
          },
          categories: categories,
        );
      case 'productCarousel':
        return HomeProductGridSection(section: section, dedup: dedup);
      case 'collection':
        return HomeCollectionSection(section: section);
      case 'editorial':
      case 'festiveEdit':
      case 'familyCollection':
        return HomeEditorialSection(section: _editorialSection(section));
      case 'tryMePromo':
        return const HomeTryMePromoSection();
      case 'sale':
      case 'promotion':
        return HomeEditorialSection(section: _editorialSection(section));
      case 'socialFollow':
        return const SizedBox.shrink();
      default:
        return const SizedBox.shrink();
    }
  }
}
