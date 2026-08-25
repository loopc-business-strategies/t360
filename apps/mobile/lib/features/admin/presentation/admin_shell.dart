import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import 'admin_home_screen.dart';

bool adminHasAny(List<String> perms, List<String> anyOf) {
  if (perms.isEmpty) return false;
  for (final p in anyOf) {
    if (perms.contains(p)) return true;
    if (p.startsWith('ai_') && perms.contains('ai.fashion')) {
      // Match narrowed alias: studio perms only (not settings/delete)
      if (p == 'ai_settings.view' ||
          p == 'ai_settings.update' ||
          p == 'ai_fashion.delete' ||
          p == 'ai_models.delete') {
        continue;
      }
      return true;
    }
  }
  return false;
}

class AdminShell extends ConsumerStatefulWidget {
  const AdminShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends ConsumerState<AdminShell> {
  List<String> _perms = [];
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _loadPerms();
  }

  Future<void> _loadPerms() async {
    try {
      final me = await ref.read(adminRepoProvider).me();
      final flags = me['featureFlags'] as Map?;
      if (flags != null && flags['mobileAdminEnabled'] == false) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Mobile admin is disabled')),
          );
          await ref.read(authStateProvider.notifier).markLoggedOut();
          if (mounted) {
            context.go('/admin/login');
          }
        }
        return;
      }
      final list = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      if (mounted) setState(() {
        _perms = list;
        _loaded = true;
      });
    } catch (_) {
      if (mounted) setState(() => _loaded = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Deferred import via providers — avoid circular import of auth
    final destinations = <({int branch, NavigationDestination dest})>[
      if (adminHasAny(_perms, ['dashboard.view', 'reports.read']) || !_loaded)
        (
          branch: 0,
          dest: const NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
        ),
      if (adminHasAny(_perms, ['products.read']) || !_loaded)
        (
          branch: 1,
          dest: const NavigationDestination(icon: Icon(Icons.inventory_2_outlined), label: 'Products'),
        ),
      if (adminHasAny(_perms, ['ai_fashion.view', 'ai.fashion']) || !_loaded)
        (
          branch: 2,
          dest: const NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), label: 'AI'),
        ),
      if (adminHasAny(_perms, ['orders.read']) || !_loaded)
        (
          branch: 3,
          dest: const NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Orders'),
        ),
      (
        branch: 4,
        dest: const NavigationDestination(icon: Icon(Icons.more_horiz), label: 'More'),
      ),
    ];

    final currentBranch = widget.navigationShell.currentIndex;
    var selected = destinations.indexWhere((d) => d.branch == currentBranch);
    if (selected < 0) selected = 0;

    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selected.clamp(0, destinations.length - 1),
        onDestinationSelected: (i) {
          widget.navigationShell.goBranch(destinations[i].branch);
        },
        destinations: destinations.map((d) => d.dest).toList(),
      ),
    );
  }
}
