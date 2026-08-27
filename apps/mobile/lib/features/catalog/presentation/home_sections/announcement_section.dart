import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/design_system.dart';

class HomeAnnouncementSection extends StatelessWidget {
  const HomeAnnouncementSection({super.key, required this.section});

  final Map<String, dynamic> section;

  @override
  Widget build(BuildContext context) {
    final message = '${section['message'] ?? ''}'.trim();
    if (message.isEmpty) return const SizedBox.shrink();
    final href = section['href']?.toString();
    return Material(
      color: TharagaiColors.ink,
      child: InkWell(
        onTap: href == null || href.isEmpty
            ? null
            : () {
                if (href.startsWith('/')) context.push(href);
              },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: TharagaiColors.elevated, fontSize: 13),
          ),
        ),
      ),
    );
  }
}
