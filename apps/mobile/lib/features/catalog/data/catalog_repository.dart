import '../../../core/api_client.dart';
import 'catalog_models.dart';

class CatalogRepository {
  CatalogRepository(this._api);

  final ApiClient _api;

  Future<List<CategoryDto>> categories() {
    return _api.get(
      '/categories',
      map: (data) {
        final list = data is List ? data : (data as Map)['items'] as List? ?? [];
        return list
            .whereType<Map>()
            .map((e) => CategoryDto.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      },
    );
  }

  Future<List<ProductDto>> products({
    String? q,
    String? category,
    String? collection,
    String? sort,
    bool tryOnEnabled = false,
    int pageSize = 40,
  }) {
    return _api.get(
      '/products',
      query: {
        if (q != null && q.isNotEmpty) 'q': q,
        if (category != null && category.isNotEmpty) 'category': category,
        if (collection != null && collection.isNotEmpty) 'collection': collection,
        if (sort != null && sort.isNotEmpty) 'sort': sort,
        if (tryOnEnabled) 'tryOnEnabled': 'true',
        'pageSize': pageSize,
      },
      map: (data) {
        final List items;
        if (data is List) {
          items = data;
        } else if (data is Map && data['items'] is List) {
          items = data['items'] as List;
        } else {
          items = const [];
        }
        return items
            .whereType<Map>()
            .map((e) => ProductDto.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      },
    );
  }

  Future<ProductDto> product(String slugOrId) {
    return _api.get(
      '/products/$slugOrId',
      map: (data) => ProductDto.fromJson(Map<String, dynamic>.from(data as Map)),
    );
  }

  Future<List<({String id, String code, String name})>> branches() {
    return _api.get(
      '/branches',
      map: (data) {
        final list = data is List ? data : [];
        return list.whereType<Map>().map((e) {
          final m = Map<String, dynamic>.from(e);
          return (
            id: m['id'] as String,
            code: m['code']?.toString() ?? '',
            name: m['name']?.toString() ?? '',
          );
        }).toList();
      },
    );
  }

  Future<Map<String, dynamic>> storefront() {
    return _api.get(
      '/settings/storefront',
      map: (data) => Map<String, dynamic>.from(data as Map),
    );
  }
}
