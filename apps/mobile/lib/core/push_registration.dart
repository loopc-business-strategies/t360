import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/repositories.dart';

/// Device push registration.
/// Production requires Firebase Messaging wiring in a follow-up (google-services).
/// Debug builds may register a labeled debug token against the devices API.
class PushRegistrationService {
  PushRegistrationService(this._ref);

  final Ref _ref;

  Future<String> register() async {
    if (kReleaseMode) {
      throw Exception(
        'Push notifications require Firebase configuration '
        '(google-services.json / GoogleService-Info.plist) before release registration.',
      );
    }
    final token = 'dev-debug-${DateTime.now().millisecondsSinceEpoch}';
    final platform = Platform.isIOS
        ? 'ios'
        : Platform.isAndroid
            ? 'android'
            : 'web';
    await _ref.read(notificationsRepositoryProvider).registerDevice(
          token: token,
          platform: platform,
        );
    return token;
  }
}

final pushRegistrationProvider = Provider<PushRegistrationService>((ref) {
  return PushRegistrationService(ref);
});
