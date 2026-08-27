import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';
import '../data/catalog_models.dart';

final productProvider = FutureProvider.family<ProductDto, String>((ref, slug) {
  return ref.watch(catalogRepositoryProvider).product(slug);
});

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({
    super.key,
    required this.slug,
    this.autoOpenTryOn = false,
  });

  final String slug;
  final bool autoOpenTryOn;

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  String? _variantId;
  var _busy = false;
  String? _message;
  var _didAutoOpenTryOn = false;

  void _openTryOn(ProductDto p, VariantDto? selected, {required bool loggedIn}) {
    final q = <String, String>{
      'productId': p.id,
      'name': p.name,
      'slug': p.slug,
      'tryOnEnabled': p.tryOnEnabled ? '1' : '0',
      if (selected != null) 'variantId': selected.id,
    };
    final path = Uri(path: '/try-on', queryParameters: q).toString();
    if (!loggedIn) {
      context.push('/auth?redirect=${Uri.encodeComponent(path)}');
      return;
    }
    context.push(path);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final async = ref.watch(productProvider(widget.slug));
    final loggedIn = ref.watch(authStateProvider).isLoggedIn;

    return Scaffold(
      appBar: TharagaiAppBar(title: t.brand),
      body: async.when(
        data: (p) {
          final variants = p.variants;
          final selected = variants.isEmpty
              ? null
              : variants.firstWhere(
                  (v) => v.id == (_variantId ?? variants.first.id),
                  orElse: () => variants.first,
                );
          if (widget.autoOpenTryOn && !_didAutoOpenTryOn && p.tryOnEnabled) {
            _didAutoOpenTryOn = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              _openTryOn(p, selected, loggedIn: loggedIn);
            });
          }
          final price = selected?.salePrice ?? selected?.price ?? p.salePrice ?? p.price ?? 0;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              AspectRatio(
                aspectRatio: 4 / 5,
                child: Image.network(
                  p.imageUrl ?? 'https://placehold.co/400x500/png',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) =>
                      const ColoredBox(color: TharagaiColors.border),
                ),
              ),
              const SizedBox(height: 16),
              if (p.brandName != null)
                Text(p.brandName!, style: const TextStyle(color: TharagaiColors.muted)),
              Text(p.name, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              TharagaiPrice(amount: price, compareAt: selected?.salePrice != null ? selected?.price : null),
              if (variants.length > 1) ...[
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final v in variants)
                      ChoiceChip(
                        label: Text([v.size, v.colour].where((e) => e != null && e.isNotEmpty).join(' / ').isEmpty
                            ? v.sku
                            : [v.size, v.colour].where((e) => e != null && e.isNotEmpty).join(' / ')),
                        selected: (selected?.id ?? '') == v.id,
                        onSelected: (_) => setState(() => _variantId = v.id),
                      ),
                  ],
                ),
              ],
              if (_message != null) ...[
                const SizedBox(height: 12),
                Text(_message!),
              ],
              const SizedBox(height: 24),
              TharagaiButton(
                label: t.addToCart,
                onPressed: _busy || selected == null
                    ? null
                    : () async {
                        if (!loggedIn) {
                          context.push('/auth?redirect=/product/${widget.slug}');
                          return;
                        }
                        setState(() {
                          _busy = true;
                          _message = null;
                        });
                        try {
                          await ref.read(cartRepositoryProvider).addItem(variantId: selected.id);
                          setState(() => _message = t.addToCart);
                        } catch (e) {
                          setState(() => _message = e.toString());
                        } finally {
                          setState(() => _busy = false);
                        }
                      },
              ),
              const SizedBox(height: 12),
              TharagaiButton(
                label: t.tryMe,
                variant: TharagaiButtonVariant.secondary,
                onPressed: _busy || !p.tryOnEnabled
                    ? null
                    : () => _openTryOn(p, selected, loggedIn: loggedIn),
              ),
              if (!p.tryOnEnabled) ...[
                const SizedBox(height: 8),
                Text(t.tryMeUnavailable, style: const TextStyle(color: TharagaiColors.muted)),
              ],
              const SizedBox(height: 12),
              TharagaiButton(
                label: t.wishlist,
                variant: TharagaiButtonVariant.outline,
                onPressed: _busy || selected == null
                    ? null
                    : () async {
                        if (!loggedIn) {
                          context.push('/auth?redirect=/product/${widget.slug}');
                          return;
                        }
                        try {
                          await ref.read(wishlistRepositoryProvider).add(selected.id);
                          setState(() => _message = t.wishlist);
                        } catch (e) {
                          setState(() => _message = e.toString());
                        }
                      },
              ),
            ],
          );
        },
        loading: () => Center(child: Text(t.loading)),
        error: (e, _) => Center(child: Text(e.toString())),
      ),
    );
  }
}
