import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_strings.dart';
import '../../data/catalog_models.dart';

class HomeCategoryGridSection extends ConsumerWidget {
  const HomeCategoryGridSection({
    super.key,
    required this.section,
    required this.categories,
  });

  final Map<String, dynamic> section;
  final List<CategoryDto> categories;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final slugs = (section['categorySlugs'] as List?)?.map((e) => '$e').toList();
    final tiles = (slugs == null || slugs.isEmpty)
        ? categories.take(6).toList()
        : [
            for (final slug in slugs)
              ...categories.where((c) => c.slug == slug).take(1),
          ];
    if (tiles.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${section['title'] ?? t.categories}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final c in tiles)
                ActionChip(
                  label: Text(c.name),
                  onPressed: () => context.push('/categories?category=${c.slug}'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
