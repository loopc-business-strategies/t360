import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'admin_home_screen.dart';

class AdminAiUsageScreen extends ConsumerStatefulWidget {
  const AdminAiUsageScreen({super.key});

  @override
  ConsumerState<AdminAiUsageScreen> createState() => _AdminAiUsageScreenState();
}

class _AdminAiUsageScreenState extends ConsumerState<AdminAiUsageScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ref.read(adminRepoProvider).aiUsage();
  }

  Widget _bucket(String title, Map? data) {
    if (data == null) return const SizedBox.shrink();
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('Total: ${data['total'] ?? 0}'),
            Text('Completed: ${data['completed'] ?? 0}'),
            Text('Failed: ${data['failed'] ?? 0}'),
            Text('Processing: ${data['processing'] ?? 0}'),
            Text('Queued: ${data['queued'] ?? 0}'),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Usage'),
        actions: [
          IconButton(
            onPressed: () => setState(() => _future = ref.read(adminRepoProvider).aiUsage()),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: FutureBuilder(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) return Center(child: Text('${snap.error}'));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final d = snap.data!;
          final limits = d['limits'] as Map? ?? {};
          final today = d['today'] as Map?;
          final month = d['month'] as Map?;
          return ListView(
            children: [
              Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Limits remaining', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text(
                        'Daily: ${limits['dailyRemaining'] ?? '—'} / ${limits['dailyLimit'] ?? '—'}',
                      ),
                      Text(
                        'Monthly: ${limits['monthlyRemaining'] ?? '—'} / ${limits['monthlyLimit'] ?? '—'}',
                      ),
                      if (d['creditsUsed'] != null && (d['creditsUsed'] as num) > 0)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text('Credits used (window): ${d['creditsUsed']}'),
                        ),
                      const Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Text(
                          'Provider dollar cost is not available unless credits are reported.',
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              _bucket('Today', today),
              _bucket('This month', month),
            ],
          );
        },
      ),
    );
  }
}
