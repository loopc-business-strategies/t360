import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';
import 'core/env.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppEnv.assertReleaseApiUrl();
  runApp(const ProviderScope(child: TharagaiApp()));
}
