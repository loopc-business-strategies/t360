import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_strings.dart';

class HomeHeroCampaignSection extends ConsumerWidget {
  const HomeHeroCampaignSection({
    super.key,
    required this.section,
    required this.storefront,
  });

  final Map<String, dynamic> section;
  final Map<String, dynamic> storefront;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final hero = storefront['hero'] is Map
        ? Map<String, dynamic>.from(storefront['hero'] as Map)
        : <String, dynamic>{};

    final imageUrl = [
      section['mobileImageUrl'],
      section['imageUrl'],
      hero['mobileImageUrl'],
      hero['imageUrl'],
      hero['desktopImageUrl'],
    ].map((e) => '$e'.trim()).firstWhere((u) => u.isNotEmpty, orElse: () => '');

    final headline = '${section['headline'] ?? hero['headline'] ?? t.tagline}';
    final subtitle = '${section['subtitle'] ?? section['body'] ?? ''}'.trim();
    final ctaLabel = '${section['ctaLabel'] ?? t.shop}'.trim();
    final ctaHref = '${section['ctaHref'] ?? '/categories'}';

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.7,
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
                  TharagaiColors.ink.withValues(alpha: 0.25),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 32, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const TharagaiWordmark(fontSize: 14, color: TharagaiColors.brass),
                const SizedBox(height: 12),
                Text(
                  headline,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: TharagaiColors.elevated,
                        fontWeight: FontWeight.w700,
                        height: 1.15,
                      ),
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Color(0xD9FFFCF8), height: 1.4),
                  ),
                ],
                const SizedBox(height: 20),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _HeroCta(
                      label: ctaLabel,
                      filled: true,
                      onTap: () => _nav(context, ctaHref),
                    ),
                    _HeroCta(
                      label: 'Shop Women',
                      onTap: () => _nav(context, '/categories?category=women'),
                    ),
                    _HeroCta(
                      label: 'Shop Men',
                      onTap: () => _nav(context, '/categories?category=men'),
                    ),
                    _HeroCta(
                      label: 'Shop Kids',
                      onTap: () => _nav(context, '/categories?category=kids'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _nav(BuildContext context, String href) {
    if (href.startsWith('/')) {
      context.push(href);
    } else {
      context.push('/categories');
    }
  }
}

class _HeroCta extends StatelessWidget {
  const _HeroCta({
    required this.label,
    required this.onTap,
    this.filled = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        foregroundColor: TharagaiColors.elevated,
        backgroundColor: filled ? TharagaiColors.elevated : Colors.transparent,
        side: BorderSide(
          color: filled ? TharagaiColors.elevated : TharagaiColors.elevated.withValues(alpha: 0.85),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          letterSpacing: 1.1,
          fontWeight: FontWeight.w600,
          color: filled ? TharagaiColors.ink : TharagaiColors.elevated,
        ),
      ),
    );
  }
}
