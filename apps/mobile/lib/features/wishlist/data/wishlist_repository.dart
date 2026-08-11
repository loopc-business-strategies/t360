import '../../../core/api_client.dart';
import '../../catalog/data/catalog_models.dart';

class WishlistRepository {
  WishlistRepository(this._api);

  final ApiClient _api;

  Future<List<ProductDto>> list() {
    return _api.get(
      '/wishlist',
      map: (data) {
        final list = data is List ? data : [];
        return list.whereType<Map>().map((e) {
          final m = Map<String, dynamic>.from(e);
          final variant = m['variant'] as Map?;
          final product = variant?['product'] as Map? ?? m['product'] as Map?;
          if (product != null) {
            final p = Map<String, dynamic>.from(product);
            if (variant != null) {
              p['variants'] = [variant];
            }
            return ProductDto.fromJson(p);
          }
          return ProductDto.fromJson(m);
        }).toList();
      },
    );
  }

  Future<void> add(String variantId) async {
    await _api.post('/wishlist', data: {'variantId': variantId}, map: (_) => true);
  }

  Future<void> remove(String variantId) async {
    await _api.delete('/wishlist/$variantId', map: (_) => true);
  }
}
