import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/orders_repository.dart';

final ordersListProvider = FutureProvider<List<OrderDto>>((ref) {
  return ref.watch(ordersRepositoryProvider).list();
});

final orderDetailProvider = FutureProvider.family<OrderDto, String>((ref, id) {
  return ref.watch(ordersRepositoryProvider).get(id);
});

TharagaiOrderStatusCode mapStatus(String s) {
  return switch (s) {
    'PaymentPending' || 'Pending' => TharagaiOrderStatusCode.pending,
    'Confirmed' || 'Processing' => TharagaiOrderStatusCode.confirmed,
    'Packed' => TharagaiOrderStatusCode.packed,
    'ReadyForPickup' || 'OutForDelivery' => TharagaiOrderStatusCode.readyForPickup,
    'Delivered' => TharagaiOrderStatusCode.delivered,
    'Cancelled' || 'Returned' || 'Refunded' => TharagaiOrderStatusCode.cancelled,
    _ => TharagaiOrderStatusCode.pending,
  };
}

class OrdersListScreen extends ConsumerWidget {
  const OrdersListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authStateProvider);
    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: TharagaiAppBar(title: t.orders),
        body: Center(
          child: TharagaiButton(
            label: t.loginRequired,
            onPressed: () => context.push('/auth?redirect=/orders'),
          ),
        ),
      );
    }
    final async = ref.watch(ordersListProvider);
    return Scaffold(
      appBar: TharagaiAppBar(title: t.orders),
      body: async.when(
        data: (list) {
          if (list.isEmpty) return const Center(child: Text('—'));
          return ListView.builder(
            itemCount: list.length,
            itemBuilder: (context, i) {
              final o = list[i];
              return ListTile(
                title: Text(o.number),
                subtitle: Text('₹${o.total}'),
                trailing: TharagaiOrderStatus(
                  status: mapStatus(o.status),
                  label: o.status,
                ),
                onTap: () => context.push('/orders/${o.id}'),
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

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final async = ref.watch(orderDetailProvider(id));
    return Scaffold(
      appBar: TharagaiAppBar(title: t.orders),
      body: async.when(
        data: (o) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(o.number, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            TharagaiOrderStatus(status: mapStatus(o.status), label: o.status),
            if (o.pickupCode != null) ...[
              const SizedBox(height: 8),
              Text('${t.pickup}: ${o.pickupCode}'),
            ],
            const SizedBox(height: 16),
            for (final item in o.items)
              ListTile(
                title: Text(item.name),
                subtitle: Text('${t.qty}: ${item.qty}'),
                trailing: Text('₹${item.lineTotal}'),
              ),
            Text('${t.orderTotal}: ₹${o.total}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            if (o.status == 'PaymentPending')
              TharagaiButton(
                label: t.cancelOrder,
                variant: TharagaiButtonVariant.outline,
                onPressed: () async {
                  await ref.read(ordersRepositoryProvider).cancel(o.id);
                  ref.invalidate(orderDetailProvider(id));
                },
              ),
            if (o.status == 'Delivered')
              TharagaiButton(
                label: t.returnOrder,
                variant: TharagaiButtonVariant.outline,
                onPressed: () async {
                  await ref.read(ordersRepositoryProvider).requestReturn(o.id);
                  ref.invalidate(orderDetailProvider(id));
                },
              ),
          ],
        ),
        loading: () => Center(child: Text(t.loading)),
        error: (e, _) => Center(child: Text(e.toString())),
      ),
    );
  }
}
