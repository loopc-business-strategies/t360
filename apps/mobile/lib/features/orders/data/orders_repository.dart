import '../../../core/api_client.dart';

class OrderDto {
  OrderDto({
    required this.id,
    required this.number,
    required this.status,
    required this.total,
    this.fulfillment,
    this.pickupCode,
    this.items = const [],
  });

  final String id;
  final String number;
  final String status;
  final double total;
  final String? fulfillment;
  final String? pickupCode;
  final List<OrderItemDto> items;

  factory OrderDto.fromJson(Map<String, dynamic> j) => OrderDto(
        id: j['id'] as String,
        number: j['number']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        total: _n(j['total']) ?? 0,
        fulfillment: j['fulfillment']?.toString(),
        pickupCode: j['pickupCode']?.toString(),
        items: (j['items'] as List? ?? [])
            .whereType<Map>()
            .map((e) => OrderItemDto.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
      );
}

class OrderItemDto {
  OrderItemDto({required this.name, required this.qty, required this.lineTotal});

  final String name;
  final int qty;
  final double lineTotal;

  factory OrderItemDto.fromJson(Map<String, dynamic> j) => OrderItemDto(
        name: j['name']?.toString() ?? '',
        qty: (j['qty'] as num?)?.toInt() ?? 0,
        lineTotal: _n(j['lineTotal']) ?? 0,
      );
}

double? _n(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString());
}

class OrdersRepository {
  OrdersRepository(this._api);

  final ApiClient _api;

  Future<List<OrderDto>> list() {
    return _api.get(
      '/orders',
      map: (data) {
        final list = data is List ? data : [];
        return list
            .whereType<Map>()
            .map((e) => OrderDto.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      },
    );
  }

  Future<OrderDto> get(String id) {
    return _api.get(
      '/orders/$id',
      map: (d) => OrderDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<Map<String, dynamic>> create({
    required String fulfillment,
    required String paymentMethod,
    String? addressId,
    String? branchId,
    String? couponCode,
    int? loyaltyPointsToRedeem,
    required String idempotencyKey,
  }) {
    return _api.post(
      '/orders',
      headers: {'Idempotency-Key': idempotencyKey},
      data: {
        'fulfillment': fulfillment,
        'paymentMethod': paymentMethod,
        'addressId': ?addressId,
        'branchId': ?branchId,
        'couponCode': ?couponCode,
        if (loyaltyPointsToRedeem != null && loyaltyPointsToRedeem > 0)
          'loyaltyPointsToRedeem': loyaltyPointsToRedeem,
      },
      map: (d) => Map<String, dynamic>.from(d as Map),
    );
  }

  Future<void> cancel(String id) async {
    await _api.post('/orders/$id/cancel', map: (_) => true);
  }

  Future<void> requestReturn(String id) async {
    await _api.post('/orders/$id/return', map: (_) => true);
  }

  Future<void> mockComplete(String orderId) async {
    await _api.post('/payments/$orderId/mock-complete', map: (_) => true);
  }

  Future<double> validateCoupon(String code, double subtotal) {
    return _api.post(
      '/coupons/validate',
      data: {'code': code, 'subtotal': subtotal},
      map: (d) => _n((d as Map)['discount']) ?? 0,
    );
  }
}
