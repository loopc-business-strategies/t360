import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'admin_home_screen.dart';
import 'admin_shell.dart';
import 'admin_video_preview.dart';

class AdminAiImagesScreen extends ConsumerStatefulWidget {
  const AdminAiImagesScreen({super.key});

  @override
  ConsumerState<AdminAiImagesScreen> createState() => _AdminAiImagesScreenState();
}

class _AdminAiImagesScreenState extends ConsumerState<AdminAiImagesScreen> {
  final List<dynamic> _items = [];
  int _page = 1;
  bool _loading = false;
  bool _done = false;
  String? _error;
  List<String> _perms = [];

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    try {
      final me = await ref.read(adminRepoProvider).me();
      _perms = (me['permissions'] as List?)?.map((e) => e.toString()).toList() ?? [];
    } catch (_) {}
    await _loadMore(reset: true);
  }

  Future<void> _loadMore({bool reset = false}) async {
    if (_loading || (!reset && _done)) return;
    setState(() {
      _loading = true;
      _error = null;
      if (reset) {
        _items.clear();
        _page = 1;
        _done = false;
      }
    });
    try {
      final batch = await ref.read(adminRepoProvider).aiJobs(page: _page, pageSize: 20);
      setState(() {
        _items.addAll(batch);
        _done = batch.length < 20;
        _page += 1;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  Future<void> _act(Future<void> Function() fn) async {
    try {
      await fn();
      await _loadMore(reset: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  void _preview(Map map) {
    final url = map['outputImageUrl']?.toString();
    if (url == null || url.isEmpty) return;
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: adminJobIsVideo(map)
              ? AdminVideoPreview(url: url)
              : InteractiveViewer(child: Image.network(url)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canApprove = adminHasAny(_perms, ['ai_fashion.approve', 'ai.fashion']);
    final canRetry = adminHasAny(_perms, ['ai_fashion.retry', 'ai.fashion']);
    final canDelete = adminHasAny(_perms, ['ai_fashion.delete']);
    final canGenerate = adminHasAny(_perms, ['ai_fashion.generate', 'ai.fashion']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Images'),
        actions: [
          IconButton(onPressed: () => _loadMore(reset: true), icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _error != null && _items.isEmpty
          ? Center(child: Text(_error!))
          : NotificationListener<ScrollNotification>(
              onNotification: (n) {
                if (n.metrics.pixels > n.metrics.maxScrollExtent - 200) {
                  _loadMore();
                }
                return false;
              },
              child: ListView.builder(
                itemCount: _items.length + (_loading || !_done ? 1 : 0),
                itemBuilder: (context, i) {
                  if (i >= _items.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  final map = Map<String, dynamic>.from(_items[i] as Map);
                  final id = map['id']?.toString() ?? '';
                  final isVideo = adminJobIsVideo(map);
                  final thumb = isVideo
                      ? map['inputImageUrl']?.toString()
                      : (map['outputImageUrl']?.toString() ?? map['inputImageUrl']?.toString());
                  final product = map['product'] as Map?;
                  final model = map['model'] as Map?;
                  final status = map['status']?.toString() ?? '';
                  final productId = map['productId']?.toString() ?? product?['id']?.toString();

                  return ListTile(
                    leading: thumb != null
                        ? Stack(
                            children: [
                              Image.network(thumb, width: 48, height: 48, fit: BoxFit.cover),
                              if (isVideo)
                                const Positioned.fill(
                                  child: Icon(Icons.play_circle_outline, color: Colors.white),
                                ),
                            ],
                          )
                        : Icon(isVideo ? Icons.videocam : Icons.image_not_supported),
                    title: Text(product?['name']?.toString() ?? 'Product'),
                    subtitle: Text(
                      '${model?['name'] ?? '—'} · ${map['type']} · $status\n${map['createdAt'] ?? ''}',
                    ),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (v) async {
                        final repo = ref.read(adminRepoProvider);
                        switch (v) {
                          case 'preview':
                            _preview(map);
                          case 'video':
                            final messenger = ScaffoldMessenger.of(context);
                            await _act(() async {
                              await repo.generateAi({
                                'type': 'IMAGE_TO_VIDEO',
                                'sourceJobId': id,
                                'productId': ?productId,
                                'duration': 5,
                                'videoResolution': '720p',
                              });
                            });
                            messenger.showSnackBar(
                              const SnackBar(content: Text('Video job queued')),
                            );
                          case 'approve':
                            await _act(() async {
                              await repo.approveJob(id, 'gallery');
                            });
                          case 'primary':
                            await _act(() async {
                              await repo.approveJob(id, 'primary');
                            });
                          case 'retry':
                            await _act(() async {
                              await repo.retryJob(id);
                            });
                          case 'reject':
                            await _act(() async {
                              await repo.deleteJob(id);
                            });
                          case 'ai':
                            if (productId != null) {
                              context.push('/admin/ai?productId=$productId');
                            }
                        }
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(value: 'preview', child: Text('Preview')),
                        if (canGenerate && status == 'COMPLETED' && !isVideo)
                          const PopupMenuItem(value: 'video', child: Text('Generate video')),
                        if (canApprove && status == 'COMPLETED') ...[
                          const PopupMenuItem(value: 'approve', child: Text('Approve')),
                          const PopupMenuItem(value: 'primary', child: Text('Set primary')),
                        ],
                        if (canRetry && (status == 'FAILED' || status == 'CANCELLED'))
                          const PopupMenuItem(value: 'retry', child: Text('Retry')),
                        if (canDelete)
                          const PopupMenuItem(value: 'reject', child: Text('Reject (delete)')),
                        if (productId != null)
                          const PopupMenuItem(value: 'ai', child: Text('Open product AI')),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}
