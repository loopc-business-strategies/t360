class CategoryDto {
  CategoryDto({required this.id, required this.name, required this.slug});

  final String id;
  final String name;
  final String slug;

  factory CategoryDto.fromJson(Map<String, dynamic> j) => CategoryDto(
        id: j['id'] as String,
        name: j['name'] as String,
        slug: j['slug'] as String? ?? '',
      );
}

class ProductDto {
  ProductDto({
    required this.id,
    required this.name,
    required this.slug,
    this.brandName,
    this.imageUrl,
    this.price,
    this.salePrice,
    this.variants = const [],
  });

  final String id;
  final String name;
  final String slug;
  final String? brandName;
  final String? imageUrl;
  final double? price;
  final double? salePrice;
  final List<VariantDto> variants;

  factory ProductDto.fromJson(Map<String, dynamic> j) {
    final variants = (j['variants'] as List? ?? [])
        .whereType<Map>()
        .map((e) => VariantDto.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    final media = j['media'] as List? ?? j['images'] as List?;
    String? imageUrl;
    if (media != null && media.isNotEmpty) {
      final first = media.first;
      if (first is Map) {
        imageUrl = first['url']?.toString() ?? first['secureUrl']?.toString();
      } else if (first is String) {
        imageUrl = first;
      }
    }
    imageUrl ??= j['imageUrl']?.toString();
    final brand = j['brand'];
    return ProductDto(
      id: j['id'] as String,
      name: j['name'] as String,
      slug: j['slug'] as String? ?? j['id'] as String,
      brandName: brand is Map ? brand['name']?.toString() : brand?.toString(),
      imageUrl: imageUrl,
      price: variants.isNotEmpty
          ? variants.first.price
          : _num(j['price']),
      salePrice: variants.isNotEmpty ? variants.first.salePrice : _num(j['salePrice']),
      variants: variants,
    );
  }
}

class VariantDto {
  VariantDto({
    required this.id,
    required this.sku,
    required this.price,
    this.salePrice,
    this.size,
    this.colour,
  });

  final String id;
  final String sku;
  final double price;
  final double? salePrice;
  final String? size;
  final String? colour;

  factory VariantDto.fromJson(Map<String, dynamic> j) => VariantDto(
        id: j['id'] as String,
        sku: j['sku']?.toString() ?? '',
        price: _num(j['price']) ?? 0,
        salePrice: _num(j['salePrice']),
        size: j['size']?.toString(),
        colour: j['colour']?.toString() ?? j['color']?.toString(),
      );
}

double? _num(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString());
}
