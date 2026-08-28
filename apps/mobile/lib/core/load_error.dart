import 'api_exception.dart';

/// User-friendly message for catalog/home load failures.
String mapLoadError(Object error) {
  if (error is ApiException) return error.message;
  final text = error.toString();
  if (text.contains('SocketException') || text.contains('Connection refused')) {
    return 'Cannot reach the server. Check your internet connection.';
  }
  if (text.contains('TimeoutException') || text.contains('timed out')) {
    return 'Request timed out. Check your connection and try again.';
  }
  return 'Could not load content. Please try again.';
}
