import '../../data/catalog_models.dart';

/// Keep in sync with apps/api/src/demo-data/engine/constants.ts
const bannedSareeImageIds = <String>[
  'photo-1594938298603-c8148c4dae35',
  'photo-1583391733956-3750e0ff4e8b',
  'photo-1610030469983-98e550d6193c',
  'photo-1694406175780-38470288c925',
];

bool isBannedSareeUrl(String? url) {
  if (url == null || url.isEmpty) return false;
  return bannedSareeImageIds.any((id) => url.contains(id));
}

/// Tracks product IDs and image URLs already shown on the home tab.
class HomeProductDedup {
  final Set<String> _seenIds = {};
  final Set<String> _seenUrls = {};

  void reset() {
    _seenIds.clear();
    _seenUrls.clear();
  }

  List<ProductDto> claimProducts(List<ProductDto> products) {
    final out = <ProductDto>[];
    for (final p in products) {
      if (isBannedSareeUrl(p.imageUrl)) continue;
      if (_seenIds.contains(p.id)) continue;
      final url = p.imageUrl;
      if (url != null && url.isNotEmpty && _seenUrls.contains(url)) continue;
      _seenIds.add(p.id);
      if (url != null && url.isNotEmpty) _seenUrls.add(url);
      out.add(p);
    }
    return out;
  }
}
