import 'package:dio/dio.dart';
import 'api_exception.dart';
import 'env.dart';
import 'token_storage.dart';

class ApiClient {
  ApiClient({
    required TokenStorage tokens,
    Dio? dio,
  }) : _tokens = tokens {
    _dio = dio ??
        Dio(
          BaseOptions(
            baseUrl: AppEnv.apiBaseUrl,
            connectTimeout: const Duration(seconds: 20),
            receiveTimeout: const Duration(seconds: 30),
            headers: {'Content-Type': 'application/json'},
          ),
        );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final access = await _tokens.getAccess();
          if (access != null && access.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $access';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              error.requestOptions.extra['retried'] != true) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final req = error.requestOptions;
              req.extra['retried'] = true;
              final access = await _tokens.getAccess();
              if (access != null) {
                req.headers['Authorization'] = 'Bearer $access';
              }
              try {
                final response = await _dio.fetch(req);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final TokenStorage _tokens;
  late final Dio _dio;

  Dio get dio => _dio;

  Future<bool> _tryRefresh() async {
    final refresh = await _tokens.getRefresh();
    if (refresh == null || refresh.isEmpty) return false;
    try {
      final res = await Dio(
        BaseOptions(baseUrl: AppEnv.apiBaseUrl),
      ).post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refresh},
      );
      final data = res.data;
      if (data == null || data['success'] != true) return false;
      final payload = data['data'] as Map<String, dynamic>;
      await _tokens.saveTokens(
        access: payload['accessToken'] as String,
        refresh: payload['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      await _tokens.clear();
      return false;
    }
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? query,
    required T Function(dynamic data) map,
  }) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(path, queryParameters: query);
      return unwrapData(res.data!, map);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  Future<T> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? headers,
    required T Function(dynamic data) map,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        path,
        data: data,
        options: headers != null ? Options(headers: headers) : null,
      );
      return unwrapData(res.data!, map);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  Future<T> patch<T>(
    String path, {
    Object? data,
    required T Function(dynamic data) map,
  }) async {
    try {
      final res = await _dio.patch<Map<String, dynamic>>(path, data: data);
      return unwrapData(res.data!, map);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  Future<T> delete<T>(
    String path, {
    required T Function(dynamic data) map,
  }) async {
    try {
      final res = await _dio.delete<Map<String, dynamic>>(path);
      return unwrapData(res.data!, map);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  Future<Map<String, dynamic>> uploadMultipart(
    String path, {
    required String filePath,
    String fieldName = 'file',
  }) async {
    try {
      final form = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(filePath),
      });
      final res = await _dio.post<Map<String, dynamic>>(
        path,
        data: form,
        options: Options(contentType: 'multipart/form-data'),
      );
      return unwrapData(res.data!, (data) => data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _mapDio(e);
    }
  }

  ApiException _mapDio(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['error'] is Map) {
      final err = data['error'] as Map;
      return ApiException(
        err['message']?.toString() ?? e.message ?? 'Network error',
        statusCode: e.response?.statusCode,
        code: err['code']?.toString(),
      );
    }
    return ApiException(
      e.message ?? 'Network error',
      statusCode: e.response?.statusCode,
    );
  }
}
