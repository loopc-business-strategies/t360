import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';
import 'admin_shell.dart';

class AdminMarketingScreen extends ConsumerStatefulWidget {
  const AdminMarketingScreen({super.key});

  @override
  ConsumerState<AdminMarketingScreen> createState() => _AdminMarketingScreenState();
}

class _AdminMarketingScreenState extends ConsumerState<AdminMarketingScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<String> _perms = [];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    ref.read(adminRepoProvider).me().then((me) {
      if (!mounted) return;
      setState(() {
        _perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
      });
    }).catchError((_) {});
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final allowed = adminHasAny(_perms, ['offers.manage', 'coupons.manage', 'marketing.view']) ||
        _perms.isEmpty;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketing'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Campaigns'),
            Tab(text: 'Coupons'),
            Tab(text: 'Segments'),
            Tab(text: 'Abandoned'),
          ],
        ),
      ),
      body: !allowed && _perms.isNotEmpty
          ? const Center(child: Text('Missing marketing permissions'))
          : TabBarView(
              controller: _tabs,
              children: [
                _ListPane(
                  loader: () => ref.read(adminRepoProvider).campaigns(),
                  titleOf: (m) => m['name']?.toString() ?? m['title']?.toString() ?? 'Campaign',
                  subtitleOf: (m) => '${m['status'] ?? ''} · ${m['channel'] ?? ''}',
                ),
                _ListPane(
                  loader: () => ref.read(adminRepoProvider).coupons(),
                  titleOf: (m) => m['code']?.toString() ?? 'Coupon',
                  subtitleOf: (m) =>
                      '${m['type'] ?? ''} ${m['value'] ?? ''} · ${m['status'] ?? m['active'] ?? ''}',
                ),
                _ListPane(
                  loader: () => ref.read(adminRepoProvider).segments(),
                  titleOf: (m) => m['name']?.toString() ?? 'Segment',
                  subtitleOf: (m) => m['description']?.toString() ?? '',
                ),
                _ListPane(
                  loader: () => ref.read(adminRepoProvider).abandonedCarts(),
                  titleOf: (m) => m['customerId']?.toString() ?? m['id']?.toString() ?? 'Cart',
                  subtitleOf: (m) =>
                      '₹${m['subtotal'] ?? m['total'] ?? ''} · ${m['updatedAt'] ?? ''}',
                ),
              ],
            ),
    );
  }
}

class _ListPane extends StatefulWidget {
  const _ListPane({
    required this.loader,
    required this.titleOf,
    required this.subtitleOf,
  });

  final Future<List<dynamic>> Function() loader;
  final String Function(Map) titleOf;
  final String Function(Map) subtitleOf;

  @override
  State<_ListPane> createState() => _ListPaneState();
}

class _ListPaneState extends State<_ListPane> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.loader();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _future,
      builder: (context, snap) {
        if (snap.hasError) {
          final msg = snap.error is ApiException
              ? (snap.error as ApiException).message
              : '${snap.error}';
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(msg, textAlign: TextAlign.center),
                ),
                TextButton(
                  onPressed: () => setState(() => _future = widget.loader()),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }
        if (!snap.hasData) return const Center(child: CircularProgressIndicator());
        final items = snap.data!;
        if (items.isEmpty) return const Center(child: Text('Nothing here yet'));
        return RefreshIndicator(
          onRefresh: () async {
            setState(() => _future = widget.loader());
            await _future;
          },
          child: ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final m = items[i] as Map;
              return ListTile(
                title: Text(widget.titleOf(m)),
                subtitle: Text(widget.subtitleOf(m)),
              );
            },
          ),
        );
      },
    );
  }
}
