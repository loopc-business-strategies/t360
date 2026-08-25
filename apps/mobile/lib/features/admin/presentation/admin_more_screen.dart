import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminMoreScreen extends ConsumerStatefulWidget {
  const AdminMoreScreen({super.key});

  @override
  ConsumerState<AdminMoreScreen> createState() => _AdminMoreScreenState();
}

class _AdminMoreScreenState extends ConsumerState<AdminMoreScreen> {
  List<String> _perms = [];

  @override
  void initState() {
    super.initState();
    ref.read(adminRepoProvider).me().then((me) {
      if (!mounted) return;
      setState(() {
        _perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      });
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        children: [
          if (adminHasAny(_perms, ['staff.manage']))
            ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Staff'),
              onTap: () => context.push('/admin/staff'),
            ),
          if (adminHasAny(_perms, ['roles.manage']))
            ListTile(
              leading: const Icon(Icons.security_outlined),
              title: const Text('Roles'),
              onTap: () => context.push('/admin/roles'),
            ),
          if (adminHasAny(_perms, ['inventory.read']))
            ListTile(
              leading: const Icon(Icons.warehouse_outlined),
              title: const Text('Inventory'),
              onTap: () => context.push('/admin/inventory'),
            ),
          if (adminHasAny(_perms, ['ai_models.view', 'ai.fashion']))
            ListTile(
              leading: const Icon(Icons.people_outline),
              title: const Text('AI Models'),
              onTap: () => context.push('/admin/ai-models'),
            ),
          if (adminHasAny(_perms, ['ai_fashion.view', 'ai.fashion']))
            ListTile(
              leading: const Icon(Icons.image_outlined),
              title: const Text('AI Images'),
              onTap: () => context.push('/admin/ai-images'),
            ),
          if (adminHasAny(_perms, ['ai_fashion.view', 'ai.fashion']))
            ListTile(
              leading: const Icon(Icons.bar_chart_outlined),
              title: const Text('AI Usage'),
              onTap: () => context.push('/admin/ai-usage'),
            ),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notifications'),
            onTap: () => context.push('/admin/notifications'),
          ),
          if (adminHasAny(_perms, ['audit.read']))
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Audit Logs'),
              onTap: () => context.push('/admin/audit'),
            ),
          if (adminHasAny(_perms, ['ai_settings.view', 'settings.manage']))
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('AI Settings'),
              onTap: () => context.push('/admin/ai-settings'),
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
              final refresh = await ref.read(tokenStorageProvider).getRefresh();
              await ref.read(adminRepoProvider).logout(refresh);
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
