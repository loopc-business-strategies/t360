/// Compile-time API base. Override with:
/// `--dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1`
class AppEnv {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api/v1',
  );
}
