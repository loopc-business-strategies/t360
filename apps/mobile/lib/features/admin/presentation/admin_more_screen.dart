import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';

class AdminMoreScreen extends ConsumerWidget {
  const AdminMoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.warehouse_outlined),
            title: const Text('Inventory'),
            onTap: () => context.push('/admin/inventory'),
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('AI Settings'),
            onTap: () => context.push('/admin/ai-settings'),
          ),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notifications'),
            onTap: () => context.push('/admin/notifications'),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Profile'),
            onTap: () => context.push('/admin/profile'),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Logout'),
            onTap: () async {
              await ref.read(authStateProvider.notifier).markLoggedOut();
              if (context.mounted) context.go('/admin/login');
            },
          ),
          ListTile(
            leading: const Icon(Icons.storefront_outlined),
            title: const Text('Customer shop'),
            onTap: () async {
              await ref.read(authStateProvider.notifier).markLoggedOut();
              if (context.mounted) context.go('/');
            },
          ),
        ],
      ),
    );
  }
}
