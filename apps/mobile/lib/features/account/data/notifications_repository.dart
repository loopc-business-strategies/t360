import '../../../core/api_client.dart';

class NotificationPrefs {
  NotificationPrefs({
    required this.marketingEmail,
    required this.marketingSms,
    required this.marketingPush,
    required this.marketingWhatsapp,
  });

  final bool marketingEmail;
  final bool marketingSms;
  final bool marketingPush;
  final bool marketingWhatsapp;

  factory NotificationPrefs.fromJson(Map<String, dynamic> j) => NotificationPrefs(
        marketingEmail: j['marketingEmail'] as bool? ?? true,
        marketingSms: j['marketingSms'] as bool? ?? true,
        marketingPush: j['marketingPush'] as bool? ?? true,
        marketingWhatsapp: j['marketingWhatsapp'] as bool? ?? true,
      );
}

class NotificationsRepository {
  NotificationsRepository(this._api);

  final ApiClient _api;

  Future<NotificationPrefs> prefs() {
    return _api.get(
      '/notifications/me/preferences',
      map: (d) => NotificationPrefs.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<NotificationPrefs> updatePrefs(Map<String, bool> body) {
    return _api.patch(
      '/notifications/me/preferences',
      data: body,
      map: (d) => NotificationPrefs.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<void> registerDevice({required String token, required String platform}) async {
    await _api.post(
      '/notifications/me/devices',
      data: {'token': token, 'platform': platform},
      map: (_) => true,
    );
  }

  Future<List<Map<String, dynamic>>> inbox() {
    return _api.get(
      '/notifications/me',
      map: (data) {
        final list = data is List ? data : [];
        return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      },
    );
  }
}
