import 'package:flutter_test/flutter_test.dart';
import 'package:tharagai_mobile/core/api_exception.dart';
import 'package:tharagai_mobile/l10n/app_strings.dart';

void main() {
  group('unwrapData', () {
    test('maps success payload', () {
      final v = unwrapData<int>(
        {'success': true, 'data': 42},
        (data) => data as int,
      );
      expect(v, 42);
    });

    test('throws ApiException on failure', () {
      expect(
        () => unwrapData(
          {
            'success': false,
            'error': {'message': 'Nope', 'code': 'X'},
          },
          (_) => null,
        ),
        throwsA(isA<ApiException>()),
      );
    });
  });

  group('AppStrings', () {
    test('switches locale', () {
      final en = AppStrings(AppLocale.en);
      final ta = AppStrings(AppLocale.ta);
      expect(en.checkout, 'Checkout');
      expect(ta.checkout, 'செக்அவுட்');
      expect(en.localeToggle, 'தமிழ்');
      expect(ta.localeToggle, 'English');
    });
  });
}
