import 'package:flutter/material.dart';
import '../tharagai_colors.dart';

class TharagaiBottomNavigation extends StatelessWidget {
  const TharagaiBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.labels,
    this.icons,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<String> labels;
  final List<IconData>? icons;

  static const _defaults = [
    Icons.home_outlined,
    Icons.grid_view_outlined,
    Icons.auto_awesome_outlined,
    Icons.favorite_outline,
    Icons.person_outline,
  ];

  @override
  Widget build(BuildContext context) {
    assert(labels.length >= 2);
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onTap,
      backgroundColor: TharagaiColors.elevated,
      indicatorColor: TharagaiColors.wine.withValues(alpha: 0.12),
      destinations: [
        for (var i = 0; i < labels.length; i++)
          NavigationDestination(
            icon: Icon(
              icons != null && i < icons!.length
                  ? icons![i]
                  : (i < _defaults.length ? _defaults[i] : Icons.circle_outlined),
            ),
            label: labels[i],
          ),
      ],
    );
  }
}
