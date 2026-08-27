import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/catalog_models.dart';
import 'announcement_section.dart';
import 'category_grid_section.dart';
import 'collection_section.dart';
import 'editorial_section.dart';
import 'hero_section.dart';
import 'product_carousel_section.dart';
import 'try_me_promo_section.dart';

export 'announcement_section.dart';
export 'category_grid_section.dart';
export 'collection_section.dart';
export 'editorial_section.dart';
export 'hero_section.dart';
export 'home_product_card.dart';
export 'product_carousel_section.dart';
export 'try_me_promo_section.dart';

class HomeSectionRenderer extends ConsumerWidget {
  const HomeSectionRenderer({
    super.key,
    required this.section,
    required this.storefront,
    required this.categories,
    required this.index,
  });

  final Map<String, dynamic> section;
  final Map<String, dynamic> storefront;
  final List<CategoryDto> categories;
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final type = '${section['type'] ?? ''}';
    switch (type) {
      case 'announcement':
        return HomeAnnouncementSection(section: section);
      case 'hero':
        return HomeHeroSection(storefront: storefront);
      case 'categoryGrid':
        return HomeCategoryGridSection(section: section, categories: categories);
      case 'productCarousel':
        return HomeProductCarouselSection(section: section);
      case 'collection':
        return HomeCollectionSection(section: section);
      case 'editorial':
        return HomeEditorialSection(section: section);
      case 'tryMePromo':
        return const HomeTryMePromoSection();
      case 'sale':
      case 'promotion':
        return HomeEditorialSection(
          section: {
            ...section,
            'headline': section['headline'] ?? section['title'],
            'body': section['subtitle'] ?? section['body'],
          },
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
