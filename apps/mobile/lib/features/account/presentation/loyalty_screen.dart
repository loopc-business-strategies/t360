import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';

class LoyaltyScreen extends ConsumerStatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  ConsumerState<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends ConsumerState<LoyaltyScreen> {
  Map<String, dynamic>? _data;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ref.read(accountRepositoryProvider).loyaltyMe();
      if (mounted) {
        setState(() {
          _data = data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '$e';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authStateProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: TharagaiAppBar(title: t.loyaltyHub),
        body: Center(
          child: TharagaiButton(
            label: t.loginRequired,
            onPressed: () => context.push('/auth?redirect=/loyalty'),
          ),
        ),
      );
    }

    final recent = (_data?['recent'] as List?) ?? const [];
    final balance = _data?['pointsBalance'] ?? 0;

    return Scaffold(
      appBar: TharagaiAppBar(title: t.loyaltyHub),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, textAlign: TextAlign.center),
                      TextButton(onPressed: _load, child: Text(t.retry)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            children: [
                              Text('$balance', style: Theme.of(context).textTheme.displaySmall),
                              Text(t.loyaltyPoints),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Recent activity', style: Theme.of(context).textTheme.titleMedium),
                      if (recent.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Text('No loyalty transactions yet'),
                        ),
                      ...recent.map((raw) {
                        final tx = raw as Map;
                        final delta = tx['delta'] ?? tx['points'] ?? 0;
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text('${tx['reason'] ?? tx['type'] ?? 'Points'}'),
                          subtitle: Text('${tx['createdAt'] ?? ''}'),
                          trailing: Text(
                            '${delta is num && delta > 0 ? '+' : ''}$delta',
                            style: TextStyle(
                              color: (delta is num && delta < 0)
                                  ? Theme.of(context).colorScheme.error
                                  : Colors.green.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
    );
  }
}
