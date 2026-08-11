import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';

class AiChatScreen extends ConsumerStatefulWidget {
  const AiChatScreen({super.key});

  @override
  ConsumerState<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends ConsumerState<AiChatScreen> {
  final _input = TextEditingController();
  final _messages = <({String role, String content})>[];
  String? _conversationId;
  var _busy = false;
  String? _error;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
      _messages.add((role: 'user', content: text));
      _input.clear();
    });
    try {
      final res = await ref.read(aiRepositoryProvider).chat(
            conversationId: _conversationId,
            message: text,
          );
      setState(() {
        _conversationId = res.conversationId;
        _messages.add((role: 'assistant', content: res.reply));
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authStateProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: TharagaiAppBar(title: t.aiTitle),
        body: Center(
          child: TharagaiButton(
            label: t.loginRequired,
            onPressed: () => context.push('/auth?redirect=${Uri.encodeComponent('/ai')}'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: TharagaiAppBar(title: t.aiTitle),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_error != null ? 1 : 0),
              itemBuilder: (context, i) {
                if (_error != null && i == _messages.length) {
                  return Text(_error!, style: const TextStyle(color: TharagaiColors.wine));
                }
                final m = _messages[i];
                return Align(
                  alignment: m.role == 'user' ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    color: m.role == 'user' ? TharagaiColors.linen : TharagaiColors.elevated,
                    child: Text(m.content),
                  ),
                );
              },
            ),
          ),
          if (_busy) const LinearProgressIndicator(minHeight: 2),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TharagaiInput(label: t.aiHint, controller: _input),
                ),
                const SizedBox(width: 8),
                TharagaiButton(label: t.send, onPressed: _busy ? null : _send),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
