import '../../../core/api_client.dart';

class CartItemDto {
  CartItemDto({
    required this.id,
    required this.variantId,
    required this.qty,
    required this.name,
    required this.unitPrice,
    required this.lineTotal,
  });

  final String id;
  final String variantId;
  final int qty;
  final String name;
  final double unitPrice;
  final double lineTotal;

  factory CartItemDto.fromJson(Map<String, dynamic> j) {
    final variant = j['variant'] as Map?;
    final product = variant?['product'] as Map?;
    final price = _n(variant?['salePrice']) ?? _n(variant?['price']) ?? _n(j['unitPrice']) ?? 0;
    final qty = (j['qty'] as num?)?.toInt() ?? 1;
    return CartItemDto(
      id: j['id'] as String,
      variantId: j['variantId'] as String? ?? variant?['id'] as String? ?? '',
      qty: qty,
      name: product?['name']?.toString() ?? j['name']?.toString() ?? 'Item',
      unitPrice: price,
      lineTotal: _n(j['lineTotal']) ?? price * qty,
    );
  }
}

class CartDto {
  CartDto({required this.items, required this.subtotal});

  final List<CartItemDto> items;
  final double subtotal;

  factory CartDto.fromJson(Map<String, dynamic> j) {
    final items = (j['items'] as List? ?? [])
        .whereType<Map>()
        .map((e) => CartItemDto.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    final sub = _n(j['subtotal']) ?? items.fold<double>(0, (s, i) => s + i.lineTotal);
    return CartDto(items: items, subtotal: sub);
  }
}

double? _n(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString());
}

class CartRepository {
  CartRepository(this._api);

  final ApiClient _api;

  Future<CartDto> getCart() {
    return _api.get('/cart', map: (d) => CartDto.fromJson(Map<String, dynamic>.from(d as Map)));
  }

  Future<CartDto> addItem({required String variantId, int qty = 1, String? branchId}) {
    return _api.post(
      '/cart/items',
      data: {
        'variantId': variantId,
        'qty': qty,
        'branchId': ?branchId,
      },
      map: (d) => CartDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<CartDto> updateQty(String itemId, int qty) {
    return _api.patch(
      '/cart/items/$itemId',
      data: {'qty': qty},
      map: (d) => CartDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<CartDto> removeItem(String itemId) {
    return _api.delete(
      '/cart/items/$itemId',
      map: (d) => CartDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }
}
