import '../../../core/api_client.dart';

class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Future<void> requestOtp(String mobile) async {
    await _api.post('/auth/otp/request', data: {'mobile': mobile}, map: (_) => true);
  }

  Future<({String access, String refresh})> verifyOtp(String mobile, String code) async {
    return _api.post(
      '/auth/otp/verify',
      data: {'mobile': mobile, 'code': code},
      map: (data) {
        final m = data as Map<String, dynamic>;
        return (
          access: m['accessToken'] as String,
          refresh: m['refreshToken'] as String,
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

  Future<void> logout(String? refreshToken) async {
    if (refreshToken == null) return;
    try {
      await _api.post('/auth/logout', data: {'refreshToken': refreshToken}, map: (_) => true);
    } catch (_) {
      /* ignore */
    }
  }
}
