import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';

class HomeEditorialSection extends StatelessWidget {
  const HomeEditorialSection({super.key, required this.section});

  final Map<String, dynamic> section;

  @override
  Widget build(BuildContext context) {
    final headline = '${section['headline'] ?? ''}'.trim();
    final body = '${section['body'] ?? ''}'.trim();
    final imageUrl = '${section['imageUrl'] ?? ''}'.trim();
    final ctaHref = section['ctaHref']?.toString();
    final ctaLabel = '${section['ctaLabel'] ?? 'Shop'}';
    if (headline.isEmpty && imageUrl.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (imageUrl.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AspectRatio(
                aspectRatio: 4 / 3,
                child: Image.network(imageUrl, fit: BoxFit.cover),
              ),
            ),
          const SizedBox(height: 12),
          if (headline.isNotEmpty)
            Text(headline, style: Theme.of(context).textTheme.headlineSmall),
          if (body.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(body, style: const TextStyle(color: TharagaiColors.muted, height: 1.4)),
          ],
          if (ctaHref != null && ctaHref.isNotEmpty) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton(
                onPressed: () {
                  if (ctaHref.startsWith('/')) context.push(ctaHref);
                },
                child: Text(ctaLabel),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
