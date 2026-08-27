import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';
import '../../../../l10n/app_strings.dart';

class HomeTryMePromoSection extends ConsumerWidget {
  const HomeTryMePromoSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      color: TharagaiColors.ink,
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t.tryMeTitle,
            style: const TextStyle(
              color: TharagaiColors.brass,
              letterSpacing: 2,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            t.tryMeGuide,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: TharagaiColors.elevated,
                ),
          ),
          const SizedBox(height: 10),
          Text(
            t.tryMeDisclaimer,
            style: const TextStyle(color: Color(0xCCFFFCF8), height: 1.4),
          ),
          const SizedBox(height: 16),
          TharagaiButton(
            label: t.tryMeTab,
            onPressed: () => context.go('/try-me'),
          ),
        ],
      ),
    );
  }
}
