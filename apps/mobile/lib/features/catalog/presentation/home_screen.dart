import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/catalog_models.dart';
import 'home_sections/home_sections.dart';

final homeStorefrontProvider = FutureProvider<Map<String, dynamic>>((ref) {
  return ref.watch(catalogRepositoryProvider).storefront();
});

final homeCategoriesProvider = FutureProvider<List<CategoryDto>>((ref) {
  return ref.watch(catalogRepositoryProvider).categories();
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final storefrontAsync = ref.watch(homeStorefrontProvider);
    final catsAsync = ref.watch(homeCategoriesProvider);

    return Scaffold(
      appBar: TharagaiAppBar(title: t.brand, showLogo: true),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(homeStorefrontProvider);
          ref.invalidate(homeCategoriesProvider);
        },
        child: storefrontAsync.when(
          loading: () => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.5,
                child: Center(child: Text(t.loading)),
              ),
            ],
          ),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            children: [
              Text(t.errorTitle),
              Text(e.toString()),
              TharagaiButton(
                label: t.retry,
                onPressed: () => ref.invalidate(homeStorefrontProvider),
              ),
            ],
          ),
          data: (storefront) {
            final categories = catsAsync.valueOrNull ?? const <CategoryDto>[];
            final rawSections = (storefront['sections'] as List? ?? [])
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .where((s) => s['visible'] != false)
                .toList()
              ..sort(
                (a, b) => ((a['order'] as num?) ?? 0).compareTo((b['order'] as num?) ?? 0),
              );

            final sections = rawSections.isEmpty
                ? [
                    <String, dynamic>{'type': 'hero', 'visible': true, 'order': 0},
                    <String, dynamic>{'type': 'categoryGrid', 'visible': true, 'order': 1},
                    <String, dynamic>{
                      'type': 'productCarousel',
                      'visible': true,
                      'order': 2,
                      'title': t.shop,
                      'query': <String, dynamic>{},
                    },
                  ]
                : rawSections;

            return ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: sections.length,
              itemBuilder: (context, i) {
                return HomeSectionRenderer(
                  section: sections[i],
                  storefront: storefront,
                  categories: categories,
                  index: i,
                );
              },
            );
          },
        ),
      ),
    );
  }
}
