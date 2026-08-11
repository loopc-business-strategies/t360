import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/providers.dart';
import '../features/ai/presentation/ai_chat_screen.dart';
import '../features/account/presentation/account_screen.dart';
import '../features/auth/presentation/auth_screen.dart';
import '../features/cart/presentation/cart_screen.dart';
import '../features/catalog/presentation/categories_screen.dart';
import '../features/catalog/presentation/home_screen.dart';
import '../features/catalog/presentation/product_detail_screen.dart';
import '../features/checkout/presentation/checkout_screen.dart';
import '../features/gallery/design_gallery_screen.dart';
import '../features/orders/presentation/orders_screen.dart';
import '../features/wishlist/presentation/wishlist_screen.dart';
import 'shell.dart';

final _rootKey = GlobalKey<NavigatorState>();

final goRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',
    refreshListenable: _AuthRefresh(ref),
    redirect: (context, state) {
      if (auth.booting) return null;
      final loggingIn = state.matchedLocation.startsWith('/auth');
      final needsAuth = state.matchedLocation.startsWith('/checkout') ||
          state.matchedLocation.startsWith('/orders') ||
          state.matchedLocation.startsWith('/ai');
      if (needsAuth && !auth.isLoggedIn && !loggingIn) {
        final redirect = Uri.encodeComponent(state.uri.toString());
        return '/auth?redirect=$redirect';
      }
      return null;
    },
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/categories',
                builder: (context, state) => CategoriesScreen(
                  initialCategory: state.uri.queryParameters['category'],
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/wishlist',
                builder: (context, state) => const WishlistScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/cart', builder: (context, state) => const CartScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/account',
                builder: (context, state) => const AccountScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/product/:slug',
        builder: (context, state) =>
            ProductDetailScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/auth',
        builder: (context, state) => AuthScreen(
          redirectTo: state.uri.queryParameters['redirect'],
        ),
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersListScreen(),
      ),
      GoRoute(
        path: '/ai',
        builder: (context, state) => const AiChatScreen(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) =>
            OrderDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/gallery',
        builder: (context, state) => const DesignGalleryScreen(),
      ),
    ],
  );
});

class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authStateProvider, (previous, next) => notifyListeners());
  }

  final Ref _ref;
}
