import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../../catalog/data/catalog_models.dart';

final wishlistProvider = FutureProvider<List<ProductDto>>((ref) {
  return ref.watch(wishlistRepositoryProvider).list();
});

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authStateProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: TharagaiAppBar(title: t.wishlist),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(t.wishlistLogin),
              const SizedBox(height: 16),
              TharagaiButton(
                label: t.account,
                onPressed: () => context.push('/auth?redirect=/wishlist'),
              ),
            ],
          ),
        ),
      );
    }

    final async = ref.watch(wishlistProvider);
    return Scaffold(
      appBar: TharagaiAppBar(title: t.wishlist),
      body: async.when(
        data: (list) {
          if (list.isEmpty) return Center(child: Text(t.emptyWishlist));
          return ListView.builder(
            itemCount: list.length,
            itemBuilder: (context, i) {
              final p = list[i];
              final variantId = p.variants.isNotEmpty ? p.variants.first.id : null;
              return ListTile(
                title: Text(p.name),
                subtitle: Text('₹${p.salePrice ?? p.price ?? 0}'),
                onTap: () => context.push('/product/${p.slug}'),
                trailing: variantId == null
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () async {
                          await ref.read(wishlistRepositoryProvider).remove(variantId);
                          ref.invalidate(wishlistProvider);
                        },
                      ),
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
