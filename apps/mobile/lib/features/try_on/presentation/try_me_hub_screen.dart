import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';

/// Customer TRY ME hub — history + browse entry (try-on starts from PDP).
class TryMeHubScreen extends ConsumerWidget {
  const TryMeHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      appBar: TharagaiAppBar(title: t.tryMeTab),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(t.tryMeTitle, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(t.tryMeGuide),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => context.go('/categories'),
            child: Text(t.shop),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.push('/try-ons'),
            child: Text(t.tryMeHistory),
          ),
        ],
      ),
    );
  }
}
