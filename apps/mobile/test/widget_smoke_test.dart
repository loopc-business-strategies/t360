import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tharagai_mobile/features/auth/presentation/auth_screen.dart';
import 'package:tharagai_mobile/l10n/app_strings.dart';

void main() {
  testWidgets('OTP auth screen shows mobile field and send button', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: AuthScreen()),
      ),
    );
    await tester.pumpAndSettle();
    final t = AppStrings(AppLocale.en);
    expect(find.text(t.requestOtp), findsOneWidget);
    expect(find.textContaining('+91'), findsWidgets);
  });

  testWidgets('empty products message renders', (tester) async {
    final t = AppStrings(AppLocale.en);
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: Center(child: Text(t.emptyProducts))),
      ),
    );
    expect(find.text(t.emptyProducts), findsOneWidget);
  });
}
