class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.code});

  final String message;
  final int? statusCode;
  final String? code;

  @override
  String toString() => message;
}

T unwrapData<T>(Map<String, dynamic> json, T Function(dynamic data) map) {
  if (json['success'] == false) {
    final err = json['error'];
    if (err is Map) {
      throw ApiException(
        err['message']?.toString() ?? 'Request failed',
        code: err['code']?.toString(),
      );
    }
    throw ApiException('Request failed');
  }
  return map(json['data']);
}
