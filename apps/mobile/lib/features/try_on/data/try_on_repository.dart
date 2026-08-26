import '../../../core/api_client.dart';

class TryOnSessionDto {
  TryOnSessionDto({
    required this.id,
    required this.status,
    required this.productId,
    this.variantId,
    this.inputImageUrl,
    this.resultImageUrl,
    this.errorMessage,
    this.productName,
    this.productSlug,
    this.createdAt,
  });

  final String id;
  final String status;
  final String productId;
  final String? variantId;
  final String? inputImageUrl;
  final String? resultImageUrl;
  final String? errorMessage;
  final String? productName;
  final String? productSlug;
  final DateTime? createdAt;

  factory TryOnSessionDto.fromJson(Map<String, dynamic> j) {
    final product = j['product'];
    return TryOnSessionDto(
      id: j['id'] as String,
      status: j['status']?.toString() ?? '',
      productId: j['productId'] as String? ?? '',
      variantId: j['variantId']?.toString(),
      inputImageUrl: j['inputImageUrl']?.toString(),
      resultImageUrl: j['resultImageUrl']?.toString(),
      errorMessage: j['errorMessage']?.toString() ?? j['expiredMessage']?.toString(),
      productName: product is Map ? product['name']?.toString() : null,
      productSlug: product is Map ? product['slug']?.toString() : null,
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) : null,
    );
  }
}

class TryOnRepository {
  TryOnRepository(this._api);

  final ApiClient _api;

  Future<Map<String, dynamic>> uploadPersonPhoto(String filePath) {
    return _api.uploadMultipart('/ai/fashion/try-on/upload', filePath: filePath);
  }

  Future<TryOnSessionDto> create({
    required String productId,
    String? variantId,
    required String inputImageUrl,
    String? inputPublicId,
    String? idempotencyKey,
    bool savePhotoConsent = false,
  }) {
    return _api.post(
      '/ai/fashion/try-on',
      data: {
        'productId': productId,
        'variantId': ?variantId,
        'inputImageUrl': inputImageUrl,
        'inputPublicId': ?inputPublicId,
        'savePhotoConsent': savePhotoConsent,
      },
      headers: {
        'Idempotency-Key': ?idempotencyKey,
      },
      map: (d) => TryOnSessionDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<TryOnSessionDto> get(String id) {
    return _api.get(
      '/ai/fashion/try-on/$id',
      map: (d) => TryOnSessionDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<List<TryOnSessionDto>> history() {
    return _api.get(
      '/ai/fashion/try-on/history',
      map: (d) {
        final map = Map<String, dynamic>.from(d as Map);
        final items = map['items'] as List? ?? [];
        return items
            .whereType<Map>()
            .map((e) => TryOnSessionDto.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      },
    );
  }

  Future<void> delete(String id) async {
    await _api.delete('/ai/fashion/try-on/$id', map: (_) => true);
  }

  Future<TryOnSessionDto> cancel(String id) {
    return _api.post(
      '/ai/fashion/try-on/$id/cancel',
      map: (d) => TryOnSessionDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }
}
