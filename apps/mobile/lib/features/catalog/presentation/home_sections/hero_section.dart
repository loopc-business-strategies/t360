import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_strings.dart';

class HomeHeroSection extends ConsumerWidget {
  const HomeHeroSection({super.key, required this.storefront});

  final Map<String, dynamic> storefront;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final locale = ref.watch(localeProvider);
    final hero = storefront['hero'] is Map
        ? Map<String, dynamic>.from(storefront['hero'] as Map)
        : <String, dynamic>{};
    final copyKey = locale == AppLocale.ta ? 'ta' : 'en';
    final copy = hero[copyKey] is Map
        ? Map<String, dynamic>.from(hero[copyKey] as Map)
        : <String, dynamic>{};
    final headline = '${copy['headline'] ?? t.tagline}';
    final support = '${copy['support'] ?? ''}';
    final ctaLabel = '${copy['ctaLabel'] ?? ''}'.trim().isEmpty
        ? t.shop
        : '${copy['ctaLabel']}'.trim();
    final ctaHref = '${hero['ctaHref'] ?? '/categories'}';
    final imageUrl =
        '${hero['mobileImageUrl'] ?? hero['imageUrl'] ?? hero['desktopImageUrl'] ?? ''}';

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.72,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imageUrl.isNotEmpty)
            Image.network(imageUrl, fit: BoxFit.cover)
          else
            Container(color: TharagaiColors.ink),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  TharagaiColors.ink.withValues(alpha: 0.92),
                  TharagaiColors.ink.withValues(alpha: 0.35),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 48, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  t.brand,
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: TharagaiColors.elevated,
                        letterSpacing: 2,
                      ),
                ),
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  width: 56,
                  height: 2,
                  color: TharagaiColors.brass,
                ),
                const SizedBox(height: 16),
                Text(
                  headline,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: TharagaiColors.elevated,
                      ),
                ),
                if (support.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    support,
                    style: const TextStyle(color: Color(0xD9FFFCF8), height: 1.4),
                  ),
                ],
                const SizedBox(height: 20),
                TharagaiButton(
                  label: ctaLabel,
                  onPressed: () {
                    if (ctaHref.startsWith('/')) {
                      context.push(ctaHref);
                    } else {
                      context.push('/categories');
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
