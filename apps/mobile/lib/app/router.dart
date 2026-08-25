import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/ai/presentation/ai_chat_screen.dart';
import '../features/account/presentation/account_screen.dart';
import '../features/admin/presentation/admin_ai_models_screen.dart';
import '../features/admin/presentation/admin_ai_screen.dart';
import '../features/admin/presentation/admin_ai_settings_screen.dart';
import '../features/admin/presentation/admin_ai_images_screen.dart';
import '../features/admin/presentation/admin_ai_usage_screen.dart';
import '../features/admin/presentation/admin_audit_screen.dart';
import '../features/admin/presentation/admin_home_screen.dart';
import '../features/admin/presentation/admin_inventory_screen.dart';
import '../features/admin/presentation/admin_login_screen.dart';
import '../features/admin/presentation/admin_more_screen.dart';
import '../features/admin/presentation/admin_notifications_screen.dart';
import '../features/admin/presentation/admin_orders_screen.dart';
import '../features/admin/presentation/admin_products_screen.dart';
import '../features/admin/presentation/admin_profile_screen.dart';
import '../features/admin/presentation/admin_roles_screen.dart';
import '../features/admin/presentation/admin_shell.dart';
import '../features/admin/presentation/admin_staff_screen.dart';
import '../features/auth/presentation/auth_screen.dart';
import '../features/cart/presentation/cart_screen.dart';
import '../features/catalog/presentation/categories_screen.dart';
import '../features/catalog/presentation/home_screen.dart';
import '../features/catalog/presentation/product_detail_screen.dart';
import '../features/checkout/presentation/checkout_screen.dart';
import '../features/gallery/design_gallery_screen.dart';
import '../features/orders/presentation/orders_screen.dart';
import '../features/wishlist/presentation/wishlist_screen.dart';
import '../core/providers.dart';
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
      final loc = state.matchedLocation;
      final loggingIn = loc.startsWith('/auth') || loc.startsWith('/admin/login');
      if (kReleaseMode && loc.startsWith('/gallery')) return '/';

      if (loc.startsWith('/admin') && !loc.startsWith('/admin/login')) {
        if (!auth.isLoggedIn || !auth.isStaff) return '/admin/login';
        return null;
      }

      if (auth.isLoggedIn && auth.isStaff && (loc == '/' || loc == '/account')) {
        return '/admin';
      }

      final needsAuth = loc.startsWith('/checkout') ||
          loc.startsWith('/orders') ||
          loc.startsWith('/ai');
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
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AdminShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/admin', builder: (context, state) => const AdminHomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/admin/products',
                builder: (context, state) => const AdminProductsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/admin/ai',
                builder: (context, state) => AdminAiScreen(
                  productId: state.uri.queryParameters['productId'],
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/admin/orders',
                builder: (context, state) => const AdminOrdersScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/admin/more', builder: (context, state) => const AdminMoreScreen()),
            ],
          ),
        ],
      ),
      GoRoute(path: '/admin/login', builder: (context, state) => const AdminLoginScreen()),
      GoRoute(path: '/admin/ai-settings', builder: (context, state) => const AdminAiSettingsScreen()),
      GoRoute(path: '/admin/ai-models', builder: (context, state) => const AdminAiModelsScreen()),
      GoRoute(path: '/admin/ai-usage', builder: (context, state) => const AdminAiUsageScreen()),
      GoRoute(path: '/admin/ai-images', builder: (context, state) => const AdminAiImagesScreen()),
      GoRoute(path: '/admin/staff', builder: (context, state) => const AdminStaffScreen()),
      GoRoute(path: '/admin/roles', builder: (context, state) => const AdminRolesScreen()),
      GoRoute(path: '/admin/audit', builder: (context, state) => const AdminAuditScreen()),
      GoRoute(path: '/admin/inventory', builder: (context, state) => const AdminInventoryScreen()),
      GoRoute(path: '/admin/profile', builder: (context, state) => const AdminProfileScreen()),
      GoRoute(
        path: '/admin/notifications',
        builder: (context, state) => const AdminNotificationsScreen(),
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
