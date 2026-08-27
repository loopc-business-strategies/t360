import '../../../core/api_exception.dart';

String mapAuthError(Object e) {
  if (e is ApiException) {
    switch (e.code) {
      case 'INVALID_OTP':
        return 'Invalid or expired OTP.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please try again later.';
      case 'MFA_REQUIRED':
        return 'Enter your verification code.';
      case 'INVALID_CREDENTIALS':
        return 'Email/ID or password is incorrect.';
      case 'ACCOUNT_LOCKED':
        return 'Account temporarily locked. Try again later.';
      case 'ACCOUNT_INACTIVE':
        return 'Your account is inactive.';
      case 'INVALID_REFRESH':
      case 'REFRESH_REUSE':
        return 'Your session has expired. Please sign in again.';
      case 'STAFF_REQUIRED':
      case 'NO_STAFF_ROLE':
        return 'You do not have permission to access Admin.';
      default:
        return e.message;
    }
  }
  return e.toString();
}
