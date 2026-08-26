import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Handles https://t360-web.vercel.app/... and t360:// deep links into Flutter routes.
class DeepLinkListener extends ConsumerStatefulWidget {
  const DeepLinkListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<DeepLinkListener> createState() => _DeepLinkListenerState();
}

class _DeepLinkListenerState extends ConsumerState<DeepLinkListener> {
  StreamSubscription<Uri>? _sub;
  final _appLinks = AppLinks();

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) _handle(initial);
      _sub = _appLinks.uriLinkStream.listen(_handle);
    } catch (_) {}
  }

  void _handle(Uri uri) {
    final path = _mapPath(uri);
    if (path == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.go(path);
    });
  }

  String? _mapPath(Uri uri) {
    final segs = uri.pathSegments;
    if (segs.isEmpty) return '/';

    // /product/:slug or /products/:slug
    if ((segs[0] == 'product' || segs[0] == 'products') && segs.length >= 2) {
      return '/product/${segs[1]}';
    }
    // /orders/:id
    if (segs[0] == 'orders' && segs.length >= 2) {
      return '/orders/${segs[1]}';
    }
    if (segs[0] == 'orders') return '/orders';
    // /try-on?productId=
    if (segs[0] == 'try-on' || segs[0] == 'try-me') {
      final q = uri.query;
      return q.isEmpty ? '/try-me' : '/try-on?$q';
    }
    if (segs[0] == 'try-ons') return '/try-ons';
    if (segs[0] == 'loyalty') return '/loyalty';
    if (segs[0] == 'account') return '/account';
    if (segs[0] == 'ai') return '/ai';
    return null;
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
