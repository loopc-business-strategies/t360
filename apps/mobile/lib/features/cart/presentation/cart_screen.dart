import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/cart_repository.dart';

final cartProvider = FutureProvider<CartDto>((ref) {
  return ref.watch(cartRepositoryProvider).getCart();
});

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authStateProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: TharagaiAppBar(title: t.cart),
        body: Center(
          child: TharagaiButton(
            label: t.loginRequired,
            onPressed: () => context.push('/auth?redirect=/cart'),
          ),
        ),
      );
    }

    final async = ref.watch(cartProvider);
    return Scaffold(
      appBar: TharagaiAppBar(title: t.cart),
      body: async.when(
        data: (cart) {
          if (cart.items.isEmpty) {
            return Center(child: Text(t.emptyCart));
          }
          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: cart.items.length,
                  itemBuilder: (context, i) {
                    final item = cart.items[i];
                    return ListTile(
                      title: Text(item.name),
                      subtitle: Text('${t.qty}: ${item.qty} · ₹${item.lineTotal}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove),
                            onPressed: item.qty <= 1
                                ? null
                                : () async {
                                    await ref
                                        .read(cartRepositoryProvider)
                                        .updateQty(item.id, item.qty - 1);
                                    ref.invalidate(cartProvider);
                                  },
                          ),
                          IconButton(
                            icon: const Icon(Icons.add),
                            onPressed: () async {
                              await ref
                                  .read(cartRepositoryProvider)
                                  .updateQty(item.id, item.qty + 1);
                              ref.invalidate(cartProvider);
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () async {
                              await ref.read(cartRepositoryProvider).removeItem(item.id);
                              ref.invalidate(cartProvider);
                            },
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('${t.orderTotal}: ₹${cart.subtotal}', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    TharagaiButton(
                      label: t.checkout,
                      onPressed: () => context.push('/checkout'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => Center(child: Text(t.loading)),
        error: (e, _) => Center(child: Text(e.toString())),
      ),
    );
  }
}
