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

  /// Digits with country code. Empty or placeholder uses Tharagai default.
  static const whatsappE164 = String.fromEnvironment(
    'WHATSAPP_E164',
    defaultValue: '917373725604',
  );

  /// Instagram profile URL. Empty uses Tharagai default.
  static const instagramUrl = String.fromEnvironment(
    'INSTAGRAM_URL',
    defaultValue: 'https://www.instagram.com/tharagai_readymades/',
  );

  static const _whatsappPlaceholder = '919876543210';

  static String? get configuredWhatsAppE164 {
    final digits = whatsappE164.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty || digits == _whatsappPlaceholder) return null;
    if (digits.length < 10) return null;
    return digits;
  }

  static String? get configuredInstagramUrl {
    final raw = instagramUrl.trim();
    if (raw.isEmpty) return null;
    final uri = Uri.tryParse(raw);
    if (uri == null || !(uri.isScheme('http') || uri.isScheme('https'))) {
      return null;
    }
    return uri.toString();
  }

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
