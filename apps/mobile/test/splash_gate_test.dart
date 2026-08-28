import 'dart:async';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tharagai_mobile/core/providers.dart';
import 'package:tharagai_mobile/core/splash_gate.dart';
import 'package:tharagai_mobile/core/token_storage.dart';

class _ImmediateTokenStorage extends TokenStorage {
  @override
  Future<String?> getAccess() async => null;

  @override
  Future<String?> getMode() async => null;
}

class _DelayedTokenStorage extends TokenStorage {
  final accessCompleter = Completer<String?>();

  @override
  Future<String?> getAccess() => accessCompleter.future;

  @override
  Future<String?> getMode() async => null;
}

ProviderContainer _container({
  required TokenStorage tokenStorage,
  Duration minDuration = const Duration(milliseconds: 80),
}) {
  return ProviderContainer(
    overrides: [
      tokenStorageProvider.overrideWithValue(tokenStorage),
      splashMinDurationProvider.overrideWith(
        (ref) => SplashMinDurationNotifier(minDuration: minDuration),
      ),
    ],
  );
}

void main() {
  group('SplashGateNotifier', () {
    test('stays not ready until min duration even if bootstrap completes immediately', () {
      fakeAsync((async) {
        final container = _container(
          tokenStorage: _ImmediateTokenStorage(),
          minDuration: const Duration(milliseconds: 80),
        );
        container.read(splashGateProvider);

        async.flushMicrotasks();

        expect(container.read(splashGateProvider).bootstrapDone, isTrue);
        expect(container.read(splashGateProvider).minDurationDone, isFalse);
        expect(container.read(splashGateProvider).ready, isFalse);

        async.elapse(const Duration(milliseconds: 80));

        expect(container.read(splashGateProvider).minDurationDone, isTrue);
        expect(container.read(splashGateProvider).ready, isTrue);

        container.dispose();
      });
    });

    test('stays not ready until bootstrap completes even after min duration', () {
      fakeAsync((async) {
        final delayedStorage = _DelayedTokenStorage();
        final container = _container(
          tokenStorage: delayedStorage,
          minDuration: const Duration(milliseconds: 30),
        );
        container.read(splashGateProvider);

        async.elapse(const Duration(milliseconds: 30));

        expect(container.read(splashGateProvider).minDurationDone, isTrue);
        expect(container.read(splashGateProvider).bootstrapDone, isFalse);
        expect(container.read(splashGateProvider).ready, isFalse);

        delayedStorage.accessCompleter.complete(null);
        async.flushMicrotasks();

        expect(container.read(splashGateProvider).bootstrapDone, isTrue);
        expect(container.read(splashGateProvider).ready, isTrue);

        container.dispose();
      });
    });
  });
}
