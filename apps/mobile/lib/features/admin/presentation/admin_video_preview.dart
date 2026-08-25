import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class AdminVideoPreview extends StatefulWidget {
  const AdminVideoPreview({super.key, required this.url, this.height = 240});

  final String url;
  final double height;

  @override
  State<AdminVideoPreview> createState() => _AdminVideoPreviewState();
}

class _AdminVideoPreviewState extends State<AdminVideoPreview> {
  late final VideoPlayerController _controller;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (mounted) setState(() {});
      }).catchError((e) {
        if (mounted) setState(() => _error = '$e');
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return SizedBox(
        height: widget.height,
        child: Center(child: Text('Video unavailable\n$_error', textAlign: TextAlign.center)),
      );
    }
    if (!_controller.value.isInitialized) {
      return SizedBox(
        height: widget.height,
        child: const Center(child: CircularProgressIndicator()),
      );
    }
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: widget.height,
          child: AspectRatio(
            aspectRatio: _controller.value.aspectRatio == 0 ? 9 / 16 : _controller.value.aspectRatio,
            child: VideoPlayer(_controller),
          ),
        ),
        IconButton(
          icon: Icon(_controller.value.isPlaying ? Icons.pause : Icons.play_arrow),
          onPressed: () {
            setState(() {
              if (_controller.value.isPlaying) {
                _controller.pause();
              } else {
                _controller.play();
              }
            });
          },
        ),
      ],
    );
  }
}

bool adminJobIsVideo(Map map) {
  return map['type']?.toString() == 'IMAGE_TO_VIDEO' || map['mediaKind']?.toString() == 'video';
}
