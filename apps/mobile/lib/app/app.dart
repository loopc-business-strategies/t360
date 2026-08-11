import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/providers.dart';
import '../design_system/tharagai_theme.dart';
import 'router.dart';

class TharagaiApp extends ConsumerWidget {
  const TharagaiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    final auth = ref.watch(authStateProvider);

    if (auth.booting) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: TharagaiTheme.light(),
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return MaterialApp.router(
      title: 'THARAGAI',
      debugShowCheckedModeBanner: false,
      theme: TharagaiTheme.light(),
      routerConfig: router,
    );
  }
}
