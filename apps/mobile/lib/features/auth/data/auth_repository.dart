import '../../../core/api_client.dart';
import 'phone_normalize.dart';

class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Future<({String? devOtp, String provider})> requestOtp(String mobile) async {
    final normalized = normalizeIndianMobile(mobile);
    return _api.post(
      '/auth/otp/request',
      data: {'mobile': normalized},
      map: (data) {
        final m = data as Map<String, dynamic>? ?? {};
        return (
          devOtp: m['devOtp']?.toString(),
          provider: m['provider']?.toString() ?? 'unknown',
        );
      },
    );
  }

  Future<({String access, String refresh, bool isNewCustomer})> verifyOtp(
    String mobile,
    String code,
  ) async {
    final normalized = normalizeIndianMobile(mobile);
    return _api.post(
      '/auth/otp/verify',
      data: {'mobile': normalized, 'code': code},
      map: (data) {
        final m = data as Map<String, dynamic>;
        return (
          access: m['accessToken'] as String,
          refresh: m['refreshToken'] as String,
          isNewCustomer: m['isNewCustomer'] == true,
        );
      },
    );
  }

  Future<({String access, String refresh})> staffLogin({
    String? email,
    String? employeeCode,
    required String password,
    String? mfaCode,
  }) async {
    return _api.post(
      '/auth/login',
      data: {
        if (email != null) 'email': email,
        if (employeeCode != null) 'employeeCode': employeeCode,
        'password': password,
        if (mfaCode != null && mfaCode.isNotEmpty) 'mfaCode': mfaCode,
      },
      map: (data) {
        final m = data as Map<String, dynamic>;
        return (
          access: m['accessToken'] as String,
          refresh: m['refreshToken'] as String,
        );
      },
    );
  }

  Future<({String access, String refresh})> refreshSession(String refreshToken) async {
    return _api.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
      map: (data) {
        final m = data as Map<String, dynamic>;
        return (
          access: m['accessToken'] as String,
          refresh: m['refreshToken'] as String,
        );
      },
    );
  }

  Future<void> logout(String? refreshToken) async {
    if (refreshToken == null) return;
    try {
      await _api.post('/auth/logout', data: {'refreshToken': refreshToken}, map: (_) => true);
    } catch (_) {
      /* ignore */
    }
  }

  Future<void> logoutAll() async {
    try {
      await _api.post('/auth/logout-all', data: {}, map: (_) => true);
    } catch (_) {
      /* ignore */
    }
  }
}
