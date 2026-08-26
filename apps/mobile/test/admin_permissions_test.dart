import 'package:flutter_test/flutter_test.dart';

import 'package:tharagai_mobile/features/admin/presentation/admin_shell.dart';

void main() {
  group('adminHasAny', () {
    test('allows orders.update when present', () {
      expect(adminHasAny(['orders.read', 'orders.update'], ['orders.update']), isTrue);
    });

    test('denies when missing', () {
      expect(adminHasAny(['orders.read'], ['orders.update']), isFalse);
    });

    test('aliases ai.fashion for studio perms', () {
      expect(adminHasAny(['ai.fashion'], ['ai_fashion.view']), isTrue);
      expect(adminHasAny(['ai.fashion'], ['ai_settings.update']), isFalse);
    });

    test('empty perms deny', () {
      expect(adminHasAny([], ['inventory.adjust']), isFalse);
    });
  });
}
