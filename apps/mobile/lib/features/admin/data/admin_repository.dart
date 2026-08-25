import '../../../core/api_client.dart';

class AdminRepository {
  AdminRepository(this._api);

  final ApiClient _api;

  Future<Map<String, dynamic>> me() =>
      _api.get('/users/me', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> dashboard() =>
      _api.get('/admin/dashboard', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> aiDashboard() =>
      _api.get('/admin/ai-fashion/dashboard', map: (d) => d as Map<String, dynamic>);

  Future<List<dynamic>> products({String? q}) => _api.get(
        '/admin/products',
        query: {'pageSize': 50, if (q != null && q.isNotEmpty) 'q': q},
        map: (d) => d as List<dynamic>,
      );

  Future<Map<String, dynamic>> product(String id) =>
      _api.get('/admin/products/$id', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> createProduct(Map<String, dynamic> body) =>
      _api.post('/admin/products', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> uploadImage(String filePath) =>
      _api.uploadMultipart('/admin/media/upload', filePath: filePath);

  Future<List<dynamic>> aiModels() => _api.get(
        '/admin/ai-fashion/models',
        query: {'activeOnly': 'true'},
        map: (d) => d as List<dynamic>,
      );

  Future<Map<String, dynamic>> generateAi(Map<String, dynamic> body) =>
      _api.post('/admin/ai-fashion/generate', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> aiJob(String id) =>
      _api.get('/admin/ai-fashion/jobs/$id', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> approveJob(String id, String as) => _api.post(
        '/admin/ai-fashion/jobs/$id/approve',
        data: {'as': as},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> retryJob(String id) =>
      _api.post('/admin/ai-fashion/jobs/$id/retry', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> aiSettings() =>
      _api.get('/admin/ai-fashion/settings', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> updateAiSettings(Map<String, dynamic> body) =>
      _api.patch('/admin/ai-fashion/settings', data: body, map: (d) => d as Map<String, dynamic>);

  Future<List<dynamic>> orders() =>
      _api.get('/admin/orders', query: {'pageSize': 30}, map: (d) => d as List<dynamic>);

  Future<List<dynamic>> notifications() =>
      _api.get('/notifications/me', map: (d) => d as List<dynamic>);

  Future<void> changePassword(String current, String next) => _api.post(
        '/auth/change-password',
        data: {'currentPassword': current, 'newPassword': next},
        map: (_) => true,
      );

  Future<void> logoutAll() =>
      _api.post('/auth/logout-all', data: {}, map: (_) => true);

  Future<List<dynamic>> categories() =>
      _api.get('/admin/categories', map: (d) => d as List<dynamic>);

  Future<List<dynamic>> lowStock() => _api.get(
        '/admin/inventory',
        query: {'lowStockOnly': 'true'},
        map: (d) => d as List<dynamic>,
      );
}
