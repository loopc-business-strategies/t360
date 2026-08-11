import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_strings.dart';

/// Phase 2/3 design system gallery (debug / reference).
class DesignGalleryScreen extends StatefulWidget {
  const DesignGalleryScreen({super.key});

  @override
  State<DesignGalleryScreen> createState() => _DesignGalleryScreenState();
}

class _DesignGalleryScreenState extends State<DesignGalleryScreen>
    with SingleTickerProviderStateMixin {
  int _index = 0;
  late final AnimationController _fadeController;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..forward();
    _fade = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings(AppLocale.en);
    return Scaffold(
      appBar: TharagaiAppBar(title: strings.gallery),
      body: FadeTransition(
        opacity: _fade,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(strings.brand, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(strings.tagline),
            const SizedBox(height: 24),
            TharagaiButton(label: strings.addToCart, onPressed: () {}),
            const SizedBox(height: 12),
            const TharagaiInput(label: 'Sample input'),
            const SizedBox(height: 12),
            const TharagaiPrice(amount: 2499, compareAt: 2999),
            const SizedBox(height: 12),
            const TharagaiOrderStatus(
              status: TharagaiOrderStatusCode.confirmed,
              label: 'Confirmed',
            ),
          ],
        ),
      ),
      bottomNavigationBar: TharagaiBottomNavigation(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        labels: [strings.home, strings.categories, strings.cart, strings.account],
      ),
    );
  }
}
