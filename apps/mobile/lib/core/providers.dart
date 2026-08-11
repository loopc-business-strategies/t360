import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'token_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(tokens: ref.watch(tokenStorageProvider));
});

final authStateProvider = StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier(ref.watch(tokenStorageProvider));
});

class AuthState {
  const AuthState({this.isLoggedIn = false, this.booting = true});

  final bool isLoggedIn;
  final bool booting;

  AuthState copyWith({bool? isLoggedIn, bool? booting}) => AuthState(
        isLoggedIn: isLoggedIn ?? this.isLoggedIn,
        booting: booting ?? this.booting,
      );
}

class AuthStateNotifier extends StateNotifier<AuthState> {
  AuthStateNotifier(this._tokens) : super(const AuthState()) {
    _bootstrap();
  }

  final TokenStorage _tokens;

  Future<void> _bootstrap() async {
    final access = await _tokens.getAccess();
    state = AuthState(isLoggedIn: access != null && access.isNotEmpty, booting: false);
  }

  Future<void> markLoggedIn() async {
    state = state.copyWith(isLoggedIn: true, booting: false);
  }

  Future<void> markLoggedOut() async {
    await _tokens.clear();
    state = state.copyWith(isLoggedIn: false, booting: false);
  }
}
