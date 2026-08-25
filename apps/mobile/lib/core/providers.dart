import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'token_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final authStateProvider = StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier(ref.watch(tokenStorageProvider));
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final tokens = ref.watch(tokenStorageProvider);
  return ApiClient(
    tokens: tokens,
    onSessionExpired: () {
      // Fire-and-forget: clear in-memory auth so GoRouter redirects to login.
      ref.read(authStateProvider.notifier).markLoggedOut();
    },
  );
});

class AuthState {
  const AuthState({
    this.isLoggedIn = false,
    this.booting = true,
    this.isStaff = false,
  });

  final bool isLoggedIn;
  final bool booting;
  final bool isStaff;

  AuthState copyWith({bool? isLoggedIn, bool? booting, bool? isStaff}) => AuthState(
        isLoggedIn: isLoggedIn ?? this.isLoggedIn,
        booting: booting ?? this.booting,
        isStaff: isStaff ?? this.isStaff,
      );
}

class AuthStateNotifier extends StateNotifier<AuthState> {
  AuthStateNotifier(this._tokens) : super(const AuthState()) {
    _bootstrap();
  }

  final TokenStorage _tokens;

  Future<void> _bootstrap() async {
    final access = await _tokens.getAccess();
    final mode = await _tokens.getMode();
    state = AuthState(
      isLoggedIn: access != null && access.isNotEmpty,
      booting: false,
      isStaff: mode == 'staff',
    );
  }

  Future<void> markLoggedIn({bool staff = false}) async {
    await _tokens.setMode(staff ? 'staff' : 'customer');
    state = state.copyWith(isLoggedIn: true, booting: false, isStaff: staff);
  }

  Future<void> markLoggedOut() async {
    await _tokens.clear();
    state = state.copyWith(isLoggedIn: false, booting: false, isStaff: false);
  }
}
