import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/providers.dart';
import 'account/data/account_repository.dart';
import 'account/data/notifications_repository.dart';
import 'ai/data/ai_repository.dart';
import 'auth/data/auth_repository.dart';
import 'cart/data/cart_repository.dart';
import 'catalog/data/catalog_repository.dart';
import 'orders/data/orders_repository.dart';
import 'wishlist/data/wishlist_repository.dart';

final authRepositoryProvider = Provider((ref) => AuthRepository(ref.watch(apiClientProvider)));
final catalogRepositoryProvider = Provider((ref) => CatalogRepository(ref.watch(apiClientProvider)));
final cartRepositoryProvider = Provider((ref) => CartRepository(ref.watch(apiClientProvider)));
final wishlistRepositoryProvider = Provider((ref) => WishlistRepository(ref.watch(apiClientProvider)));
final ordersRepositoryProvider = Provider((ref) => OrdersRepository(ref.watch(apiClientProvider)));
final accountRepositoryProvider = Provider((ref) => AccountRepository(ref.watch(apiClientProvider)));
final notificationsRepositoryProvider =
    Provider((ref) => NotificationsRepository(ref.watch(apiClientProvider)));
final aiRepositoryProvider = Provider((ref) => AiRepository(ref.watch(apiClientProvider)));
