import 'package:flutter/foundation.dart';

/// Compile-time API base. Override with:
/// `--dart-define=API_BASE_URL=https://api.example.com/api/v1`
class AppEnv {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api/v1',
  );

  static const allowLocalhostInRelease = bool.fromEnvironment(
    'ALLOW_LOCALHOST_API',
    defaultValue: false,
  );

  /// Call once at app start in release builds.
  static void assertReleaseApiUrl() {
    if (!kReleaseMode) return;
    if (allowLocalhostInRelease) return;
    final lower = apiBaseUrl.toLowerCase();
    final isLocal = lower.contains('localhost') ||
        lower.contains('127.0.0.1') ||
        lower.contains('10.0.2.2');
    assert(
      !isLocal,
      'Release builds require --dart-define=API_BASE_URL=... (non-localhost). '
      'Use scripts/launch/build-mobile-apk.ps1 or set ALLOW_LOCALHOST_API=true for emergency.',
    );
    if (isLocal) {
      throw StateError(
        'Release build blocked: API_BASE_URL points at localhost. '
        'Pass a production API URL via --dart-define=API_BASE_URL=...',
      );
    }
  }
}
