import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/deep_link_listener.dart';
import '../core/splash_gate.dart';
import '../design_system/tharagai_theme.dart';
import 'router.dart';

const _splashFill = Color(0xFF070000);

class TharagaiApp extends ConsumerStatefulWidget {
  const TharagaiApp({super.key});

  @override
  ConsumerState<TharagaiApp> createState() => _TharagaiAppState();
}

class _TharagaiAppState extends ConsumerState<TharagaiApp> {
  var _splashRemoved = false;

  @override
  void initState() {
    super.initState();
    ref.listenManual(splashGateProvider, (prev, next) {
      if (prev?.ready != true && next.ready) {
        _removeNativeSplash();
      }
    });
  }

  void _removeNativeSplash() {
    if (_splashRemoved) return;
    _splashRemoved = true;
    FlutterNativeSplash.remove();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(goRouterProvider);
    final splashGate = ref.watch(splashGateProvider);

    if (!splashGate.ready) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: TharagaiTheme.light(),
        home: const _BootSplashScreen(),
      );
    }

    return DeepLinkListener(
      child: MaterialApp.router(
        title: 'Tharagai Fashion',
        debugShowCheckedModeBanner: false,
        theme: TharagaiTheme.light(),
        routerConfig: router,
      ),
    );
  }
}

/// Matches native splash artwork while auth tokens load — no spinner flash.
class _BootSplashScreen extends StatelessWidget {
  const _BootSplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: _splashFill,
      body: ColoredBox(
        color: _splashFill,
        child: Center(
          child: Image(
            image: AssetImage('assets/branding/tharagai_splash.png'),
            fit: BoxFit.contain,
            width: double.infinity,
            height: double.infinity,
            filterQuality: FilterQuality.high,
          ),
        ),
      ),
    );
  }
}
