import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminStorefrontScreen extends ConsumerStatefulWidget {
  const AdminStorefrontScreen({super.key});

  @override
  ConsumerState<AdminStorefrontScreen> createState() => _AdminStorefrontScreenState();
}

class _AdminStorefrontScreenState extends ConsumerState<AdminStorefrontScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _useDraft = true;
  String? _error;
  String? _message;

  final _desktopImage = TextEditingController();
  final _mobileImage = TextEditingController();
  final _imageUrl = TextEditingController();
  final _videoUrl = TextEditingController();
  final _ctaHref = TextEditingController(text: '/products');
  final _enHeadline = TextEditingController();
  final _enSupport = TextEditingController();
  final _enCta = TextEditingController();
  final _taHeadline = TextEditingController();
  final _taSupport = TextEditingController();
  final _taCta = TextEditingController();

  List<Map<String, dynamic>> _sections = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _desktopImage.dispose();
    _mobileImage.dispose();
    _imageUrl.dispose();
    _videoUrl.dispose();
    _ctaHref.dispose();
    _enHeadline.dispose();
    _enSupport.dispose();
    _enCta.dispose();
    _taHeadline.dispose();
    _taSupport.dispose();
    _taCta.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(adminRepoProvider);
      final data = _useDraft ? await repo.getStorefrontDraft() : await repo.getStorefrontLive();
      final hero = data['hero'] is Map ? Map<String, dynamic>.from(data['hero'] as Map) : null;
      final en = hero?['en'] is Map ? Map<String, dynamic>.from(hero!['en'] as Map) : {};
      final ta = hero?['ta'] is Map ? Map<String, dynamic>.from(hero!['ta'] as Map) : {};
      final sections = (data['sections'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList()
        ..sort((a, b) => ((a['order'] as num?) ?? 0).compareTo((b['order'] as num?) ?? 0));

      if (!mounted) return;
      setState(() {
        _desktopImage.text = '${hero?['desktopImageUrl'] ?? hero?['imageUrl'] ?? ''}';
        _mobileImage.text = '${hero?['mobileImageUrl'] ?? hero?['imageUrl'] ?? ''}';
        _imageUrl.text = '${hero?['imageUrl'] ?? ''}';
        _videoUrl.text = '${hero?['videoUrl'] ?? ''}';
        _ctaHref.text = '${hero?['ctaHref'] ?? '/products'}';
        _enHeadline.text = '${en['headline'] ?? ''}';
        _enSupport.text = '${en['support'] ?? ''}';
        _enCta.text = '${en['ctaLabel'] ?? ''}';
        _taHeadline.text = '${ta['headline'] ?? ''}';
        _taSupport.text = '${ta['support'] ?? ''}';
        _taCta.text = '${ta['ctaLabel'] ?? ''}';
        _sections = sections;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '$e';
          _loading = false;
        });
      }
    }
  }

  Map<String, dynamic> _heroBody() {
    final enCta = _enCta.text.trim();
    final taCta = _taCta.text.trim();
    final video = _videoUrl.text.trim();
    return {
      'imageUrl': _imageUrl.text.trim().isEmpty ? _desktopImage.text.trim() : _imageUrl.text.trim(),
      'desktopImageUrl': _desktopImage.text.trim(),
      'mobileImageUrl': _mobileImage.text.trim(),
      'ctaHref': _ctaHref.text.trim().isEmpty ? '/products' : _ctaHref.text.trim(),
      if (video.isNotEmpty) 'videoUrl': video,
      'en': {
        'headline': _enHeadline.text.trim(),
        'support': _enSupport.text.trim(),
        if (enCta.isNotEmpty) 'ctaLabel': enCta,
      },
      'ta': {
        'headline': _taHeadline.text.trim(),
        'support': _taSupport.text.trim(),
        if (taCta.isNotEmpty) 'ctaLabel': taCta,
      },
    };
  }

  Future<void> _saveDraft() async {
    setState(() {
      _saving = true;
      _message = null;
    });
    try {
      final sections = [
        for (var i = 0; i < _sections.length; i++) {..._sections[i], 'order': i},
      ];
      await ref.read(adminRepoProvider).updateStorefront(
            {'hero': _heroBody(), 'sections': sections},
            draft: true,
          );
      if (mounted) {
        setState(() => _message = 'Draft saved');
        await _load();
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _publish() async {
    setState(() {
      _saving = true;
      _message = null;
    });
    try {
      final sections = [
        for (var i = 0; i < _sections.length; i++) {..._sections[i], 'order': i},
      ];
      await ref.read(adminRepoProvider).updateStorefront(
            {'hero': _heroBody(), 'sections': sections},
            draft: true,
          );
      await ref.read(adminRepoProvider).publishStorefront();
      if (mounted) {
        setState(() {
          _message = 'Published to live storefront';
          _useDraft = false;
        });
        await _load();
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _move(int index, int dir) {
    final target = index + dir;
    if (target < 0 || target >= _sections.length) return;
    setState(() {
      final next = [..._sections];
      final tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      _sections = [
        for (var i = 0; i < next.length; i++) {...next[i], 'order': i},
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Storefront'),
        actions: [
          TextButton(
            onPressed: _loading
                ? null
                : () {
                    setState(() => _useDraft = !_useDraft);
                    _load();
                  },
            child: Text(_useDraft ? 'View live' : 'Edit draft'),
          ),
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, textAlign: TextAlign.center),
                      TextButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_message != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(_message!, style: Theme.of(context).textTheme.bodyMedium),
                      ),
                    Text('Hero', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _desktopImage,
                      decoration: const InputDecoration(labelText: 'Desktop image URL'),
                    ),
                    TextField(
                      controller: _mobileImage,
                      decoration: const InputDecoration(labelText: 'Mobile image URL'),
                    ),
                    TextField(
                      controller: _imageUrl,
                      decoration: const InputDecoration(labelText: 'Fallback image URL'),
                    ),
                    TextField(
                      controller: _videoUrl,
                      decoration: const InputDecoration(labelText: 'Hero video URL'),
                    ),
                    TextField(
                      controller: _ctaHref,
                      decoration: const InputDecoration(labelText: 'CTA href'),
                    ),
                    TextField(
                      controller: _enHeadline,
                      decoration: const InputDecoration(labelText: 'English headline'),
                    ),
                    TextField(
                      controller: _enSupport,
                      decoration: const InputDecoration(labelText: 'English support'),
                    ),
                    TextField(
                      controller: _enCta,
                      decoration: const InputDecoration(labelText: 'English CTA label'),
                    ),
                    TextField(
                      controller: _taHeadline,
                      decoration: const InputDecoration(labelText: 'Tamil headline'),
                    ),
                    TextField(
                      controller: _taSupport,
                      decoration: const InputDecoration(labelText: 'Tamil support'),
                    ),
                    TextField(
                      controller: _taCta,
                      decoration: const InputDecoration(labelText: 'Tamil CTA label'),
                    ),
                    const SizedBox(height: 20),
                    Text('Sections', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    for (var i = 0; i < _sections.length; i++)
                      Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text('${_sections[i]['type'] ?? 'section'}'),
                          subtitle: Text(_sections[i]['title']?.toString() ??
                              _sections[i]['message']?.toString() ??
                              _sections[i]['headline']?.toString() ??
                              ''),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Switch(
                                value: _sections[i]['visible'] != false,
                                onChanged: (v) {
                                  setState(() {
                                    _sections[i] = {..._sections[i], 'visible': v};
                                  });
                                },
                              ),
                              IconButton(
                                onPressed: () => _move(i, -1),
                                icon: const Icon(Icons.arrow_upward),
                              ),
                              IconButton(
                                onPressed: () => _move(i, 1),
                                icon: const Icon(Icons.arrow_downward),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _saving ? null : _saveDraft,
                      child: Text(_saving ? 'Saving…' : 'Save draft'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: _saving ? null : _publish,
                      child: const Text('Publish'),
                    ),
                  ],
                ),
    );
  }
}
