import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/try_on_repository.dart';

final tryOnHistoryProvider = FutureProvider<List<TryOnSessionDto>>((ref) {
  return ref.watch(tryOnRepositoryProvider).history();
});

class TryOnHistoryScreen extends ConsumerWidget {
  const TryOnHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final loggedIn = ref.watch(authStateProvider).isLoggedIn;
    if (!loggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go('/auth?redirect=/try-ons');
      });
      return Scaffold(appBar: TharagaiAppBar(title: t.tryMeHistory), body: Center(child: Text(t.loginRequired)));
    }

    final async = ref.watch(tryOnHistoryProvider);
    return Scaffold(
      appBar: TharagaiAppBar(title: t.tryMeHistory),
      body: async.when(
        data: (items) {
          if (items.isEmpty) {
            return Center(child: Text(t.emptyProducts));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final item = items[i];
              final thumb = item.resultImageUrl ?? item.inputImageUrl;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: thumb != null
                    ? Image.network(thumb, width: 56, height: 72, fit: BoxFit.cover)
                    : const SizedBox(width: 56, height: 72),
                title: Text(item.productName ?? item.productId),
                subtitle: Text('${item.status}${item.createdAt != null ? ' · ${item.createdAt}' : ''}'),
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () async {
                    await ref.read(tryOnRepositoryProvider).delete(item.id);
                    ref.invalidate(tryOnHistoryProvider);
                  },
                ),
                onTap: item.productSlug != null
                    ? () => context.push('/product/${item.productSlug}')
                    : null,
              );
            },
          );
        },
        loading: () => Center(child: Text(t.loading)),
        error: (e, _) => Center(child: Text(e.toString())),
      ),
    );
  }
}
