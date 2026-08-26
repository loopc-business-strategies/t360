import 'package:dio/dio.dart';
import 'api_exception.dart';
import 'env.dart';
import 'token_storage.dart';

enum _RefreshOutcome { ok, authFailed, networkFailed, noToken }

class ApiClient {
  ApiClient({
    required TokenStorage tokens,
    this.onSessionExpired,
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
          final refresh = await _tokens.getRefresh();
          if (refresh != null && refresh.isNotEmpty) {
            options.headers['X-Refresh-Token'] = refresh;
          }
          final mode = await _tokens.getMode();
          if (mode == 'staff') {
            options.headers['X-T360-Client'] = 'mobile-admin';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              error.requestOptions.extra['retried'] != true) {
            final outcome = await _tryRefresh();
            if (outcome == _RefreshOutcome.ok) {
              final req = error.requestOptions;
              req.extra['retried'] = true;
              final access = await _tokens.getAccess();
              if (access != null) {
                req.headers['Authorization'] = 'Bearer $access';
              }
              try {
                final response = await _dio.fetch(req);
                return handler.resolve(response);
              } catch (_) {
                return handler.next(error);
              }
            }
            if (outcome == _RefreshOutcome.authFailed ||
                outcome == _RefreshOutcome.noToken) {
              onSessionExpired?.call();
              return handler.next(error);
            }
            if (outcome == _RefreshOutcome.networkFailed) {
              return handler.next(
                DioException(
                  requestOptions: error.requestOptions,
                  type: DioExceptionType.connectionError,
                  message: 'Server temporarily unavailable. Please try again.',
                  error: error.error,
                ),
              );
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final TokenStorage _tokens;
  final void Function()? onSessionExpired;
  late final Dio _dio;
  Future<_RefreshOutcome>? _refreshInFlight;

  Dio get dio => _dio;

  Future<_RefreshOutcome> _tryRefresh() async {
    if (_refreshInFlight != null) return _refreshInFlight!;
    _refreshInFlight = () async {
      final refresh = await _tokens.getRefresh();
      if (refresh == null || refresh.isEmpty) return _RefreshOutcome.noToken;
      try {
        final res = await Dio(
          BaseOptions(
            baseUrl: AppEnv.apiBaseUrl,
            connectTimeout: const Duration(seconds: 20),
            receiveTimeout: const Duration(seconds: 30),
          ),
        ).post<Map<String, dynamic>>(
          '/auth/refresh',
          data: {'refreshToken': refresh},
        );
        final data = res.data;
        if (data == null || data['success'] != true) {
          await _tokens.clear();
          return _RefreshOutcome.authFailed;
        }
        final payload = data['data'] as Map<String, dynamic>?;
        final access = payload?['accessToken']?.toString();
        final nextRefresh = payload?['refreshToken']?.toString();
        if (access == null ||
            access.isEmpty ||
            nextRefresh == null ||
            nextRefresh.isEmpty) {
          await _tokens.clear();
          return _RefreshOutcome.authFailed;
        }
        await _tokens.saveTokens(access: access, refresh: nextRefresh);
        return _RefreshOutcome.ok;
      } on DioException catch (e) {
        final code = e.response?.statusCode;
        if (code == 401 || code == 403) {
          await _tokens.clear();
          return _RefreshOutcome.authFailed;
        }
        // Timeouts / connection errors: keep tokens
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.sendTimeout ||
            e.type == DioExceptionType.receiveTimeout ||
            e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.unknown) {
          return _RefreshOutcome.networkFailed;
        }
        if (code != null && code >= 500) {
          return _RefreshOutcome.networkFailed;
        }
        await _tokens.clear();
        return _RefreshOutcome.authFailed;
      } catch (_) {
        return _RefreshOutcome.networkFailed;
      }
    }();
    try {
      return await _refreshInFlight!;
    } finally {
      _refreshInFlight = null;
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
