import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers.dart';

/// Minimum time the splash artwork stays visible on cold start.
const kSplashMinDuration = Duration(milliseconds: 1800);

class SplashGateState {
  const SplashGateState({
    required this.bootstrapDone,
    required this.minDurationDone,
  });

  final bool bootstrapDone;
  final bool minDurationDone;

  bool get ready => bootstrapDone && minDurationDone;
}

class SplashMinDurationNotifier extends StateNotifier<bool> {
  SplashMinDurationNotifier({Duration minDuration = kSplashMinDuration}) : super(false) {
    _timer = Timer(minDuration, () => state = true);
  }

  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final splashMinDurationProvider =
    StateNotifierProvider<SplashMinDurationNotifier, bool>((ref) {
  return SplashMinDurationNotifier();
});

final splashGateProvider = Provider<SplashGateState>((ref) {
  final auth = ref.watch(authStateProvider);
  final minDurationDone = ref.watch(splashMinDurationProvider);
  return SplashGateState(
    bootstrapDone: !auth.booting,
    minDurationDone: minDurationDone,
  );
});
