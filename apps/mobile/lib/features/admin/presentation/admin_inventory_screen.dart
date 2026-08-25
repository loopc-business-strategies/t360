import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';

class AdminInventoryScreen extends ConsumerWidget {
  const AdminInventoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inventory')),
      body: FutureBuilder(
        future: ref.read(adminRepoProvider).lowStock(),
        builder: (context, snap) {
          if (snap.hasError) {
            return Center(child: Text('${snap.error}'));
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data!;
          if (items.isEmpty) {
            return const Center(child: Text('No low-stock items'));
          }
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final row = items[i] as Map;
              final variant = row['variant'] as Map?;
              final branch = row['branch'] as Map?;
              final product = variant?['product'] as Map?;
              final title = product?['name']?.toString() ??
                  variant?['sku']?.toString() ??
                  row['variantId']?.toString() ??
                  'Item';
              return ListTile(
                title: Text(title),
                subtitle: Text(
                  'Available: ${row['availableQty'] ?? '?'} · ${branch?['name'] ?? row['branchId'] ?? ''}',
                ),
              );
            },
          );
        },
      ),
    );
  }
}
