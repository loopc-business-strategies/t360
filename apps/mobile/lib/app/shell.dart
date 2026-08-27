import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_strings.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: TharagaiBottomNavigation(
        currentIndex: navigationShell.currentIndex,
        onTap: (i) => navigationShell.goBranch(
          i,
          initialLocation: i == navigationShell.currentIndex,
        ),
        labels: [t.home, t.shop, t.tryMeTab, t.wishlist, t.profile],
        icons: const [
          Icons.home_outlined,
          Icons.grid_view_outlined,
          Icons.auto_awesome_outlined,
          Icons.favorite_outline,
          Icons.person_outline,
        ],
      ),
    );
  }
}
