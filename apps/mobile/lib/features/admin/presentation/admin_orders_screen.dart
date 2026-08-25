import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';

class AdminOrdersScreen extends ConsumerWidget {
  const AdminOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: FutureBuilder(
        future: ref.read(adminRepoProvider).orders(),
        builder: (context, snap) {
          if (snap.hasError) return Center(child: Text('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final items = snap.data!;
          if (items.isEmpty) return const Center(child: Text('No orders'));
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final o = items[i] as Map<String, dynamic>;
              return ListTile(
                title: Text(o['id']?.toString().substring(0, 8) ?? 'Order'),
                subtitle: Text('${o['status'] ?? ''}'),
                trailing: Text('₹${o['total'] ?? o['grandTotal'] ?? ''}'),
              );
            },
          );
        },
      ),
    );
  }
}
