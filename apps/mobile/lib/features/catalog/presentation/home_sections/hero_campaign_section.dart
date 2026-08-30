import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_strings.dart';
import '../../../repositories.dart';
import '../../data/catalog_models.dart';
import 'home_product_dedup.dart';

class _HeroSlide {
  const _HeroSlide(this.imageUrl);

  final String imageUrl;
}

class HomeHeroCampaignSection extends ConsumerStatefulWidget {
  const HomeHeroCampaignSection({
    super.key,
    required this.section,
    required this.storefront,
  });

  final Map<String, dynamic> section;
  final Map<String, dynamic> storefront;

  @override
  ConsumerState<HomeHeroCampaignSection> createState() =>
      _HomeHeroCampaignSectionState();
}

class _HomeHeroCampaignSectionState extends ConsumerState<HomeHeroCampaignSection> {
  final PageController _pageController = PageController();
  List<_HeroSlide> _slides = [];
  int _index = 0;
  bool _loading = true;
  bool _dragging = false;
  Timer? _autoplay;

  @override
  void initState() {
    super.initState();
    _loadSlides();
  }

  @override
  void didUpdateWidget(covariant HomeHeroCampaignSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.section != widget.section ||
        oldWidget.storefront != widget.storefront) {
      _loadSlides();
    }
  }

  @override
  void dispose() {
    _autoplay?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  String _campaignImageUrl() {
    final hero = widget.storefront['hero'] is Map
        ? Map<String, dynamic>.from(widget.storefront['hero'] as Map)
        : <String, dynamic>{};
    return [
      widget.section['mobileImageUrl'],
      widget.section['imageUrl'],
      hero['mobileImageUrl'],
      hero['imageUrl'],
      hero['desktopImageUrl'],
    ].map((e) => '$e'.trim()).firstWhere((u) => u.isNotEmpty, orElse: () => '');
  }

  Future<void> _loadSlides() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(catalogRepositoryProvider);
      var products = await repo.products(isFeatured: true, pageSize: 12);
      if (products.isEmpty) {
        products = await repo.products(isNew: true, pageSize: 12);
      }

      final slides = <_HeroSlide>[];
      final seen = <String>{};

      final campaignUrl = _campaignImageUrl();
      if (campaignUrl.isNotEmpty && !isBannedSareeUrl(campaignUrl)) {
        slides.add(_HeroSlide(campaignUrl));
        seen.add(campaignUrl);
      }

      for (final p in products) {
        final url = _productImageUrl(p);
        if (url == null || seen.contains(url) || isBannedSareeUrl(url)) continue;
        seen.add(url);
        slides.add(_HeroSlide(url));
      }

      if (!mounted) return;
      setState(() {
        _slides = slides;
        _index = 0;
        _loading = false;
      });
      if (_slides.length >= 2) {
        _pageController.jumpToPage(0);
      }
      _scheduleAutoplay();
    } catch (_) {
      if (mounted) {
        setState(() {
          _slides = [];
          _loading = false;
        });
      }
    }
  }

  String? _productImageUrl(ProductDto p) {
    final url = p.imageUrl?.trim();
    if (url != null && url.isNotEmpty) return url;
    return null;
  }

  void _scheduleAutoplay() {
    _autoplay?.cancel();
    if (!mounted) return;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    if (reduceMotion || _slides.length < 2 || _dragging) return;

    _autoplay = Timer.periodic(const Duration(seconds: 6), (_) {
      if (!mounted || _slides.length < 2 || _dragging) return;
      final next = (_index + 1) % _slides.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOut,
      );
    });
  }

  void _goTo(int i) {
    if (_slides.isEmpty) return;
    final safe = i % _slides.length;
    setState(() => _index = safe);
    _pageController.animateToPage(
      safe,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final headline =
        '${widget.section['headline'] ?? widget.storefront['hero']?['headline'] ?? t.tagline}';
    final subtitle =
        '${widget.section['subtitle'] ?? widget.section['body'] ?? ''}'.trim();
    final ctaLabel = '${widget.section['ctaLabel'] ?? t.shop}'.trim();
    final ctaHref = '${widget.section['ctaHref'] ?? '/categories'}';
    final showControls = _slides.length >= 2;

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.7,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (_loading)
            Container(color: TharagaiColors.ink)
          else if (_slides.isEmpty)
            Container(color: TharagaiColors.ink)
          else
            NotificationListener<ScrollNotification>(
              onNotification: (n) {
                if (n is ScrollStartNotification && n.dragDetails != null) {
                  setState(() => _dragging = true);
                  _autoplay?.cancel();
                } else if (n is ScrollEndNotification) {
                  setState(() => _dragging = false);
                  _scheduleAutoplay();
                }
                return false;
              },
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) {
                  return Image.network(
                    _slides[i].imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) =>
                        Container(color: TharagaiColors.ink),
                  );
                },
              ),
            ),
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
                      label: 'Shop Men',
                      onTap: () => _nav(context, '/categories?category=men'),
                    ),
                    _HeroCta(
                      label: 'Shop Kids',
                      onTap: () => _nav(context, '/categories?category=kids'),
                    ),
                  ],
                ),
                if (showControls) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      for (var i = 0; i < _slides.length; i++)
                        GestureDetector(
                          onTap: () => _goTo(i),
                          child: Container(
                            width: i == _index ? 18 : 8,
                            height: 8,
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(4),
                              color: i == _index
                                  ? TharagaiColors.elevated
                                  : TharagaiColors.elevated.withValues(alpha: 0.45),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
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
          color: filled
              ? TharagaiColors.elevated
              : TharagaiColors.elevated.withValues(alpha: 0.85),
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
