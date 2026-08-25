import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../data/admin_repository.dart';

final adminRepoProvider = Provider((ref) => AdminRepository(ref.watch(apiClientProvider)));

class AdminHomeScreen extends ConsumerWidget {
  const AdminHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin')),
      body: FutureBuilder(
        future: Future.wait([
          ref.read(adminRepoProvider).dashboard().catchError((_) => <String, dynamic>{}),
          ref.read(adminRepoProvider).aiDashboard().catchError((_) => <String, dynamic>{}),
        ]),
        builder: (context, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final ai = snap.data![1];
          final counts = (ai['counts'] as Map?) ?? {};
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Dashboard', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('AI Fashion', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text('${counts['completed'] ?? 0} completed · ${counts['processing'] ?? 0} processing · ${counts['failed'] ?? 0} failed'),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => context.go('/admin/ai'),
                        child: const Text('Generate AI Image'),
                      ),
                    ],
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.inventory_2_outlined),
                title: const Text('Products'),
                onTap: () => context.go('/admin/products'),
              ),
              ListTile(
                leading: const Icon(Icons.receipt_long_outlined),
                title: const Text('Orders'),
                onTap: () => context.go('/admin/orders'),
              ),
            ],
          );
        },
      ),
    );
  }
}
