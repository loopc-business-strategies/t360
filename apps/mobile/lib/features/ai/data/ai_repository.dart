import '../../../core/api_client.dart';

class AiChatResult {
  AiChatResult({required this.conversationId, required this.reply});

  final String conversationId;
  final String reply;

  factory AiChatResult.fromJson(Map<String, dynamic> j) => AiChatResult(
        conversationId: j['conversationId'] as String,
        reply: j['reply'] as String,
      );
}

class AiRepository {
  AiRepository(this._api);

  final ApiClient _api;

  Future<AiChatResult> chat({String? conversationId, required String message}) {
    return _api.post(
      '/ai/chat',
      data: {
        'conversationId': ?conversationId,
        'message': message,
      },
      map: (d) => AiChatResult.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }
}
