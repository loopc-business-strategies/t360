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

  Future<Map<String, dynamic>> updateProduct(String id, Map<String, dynamic> body) =>
      _api.patch('/admin/products/$id', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> uploadImage(String filePath) =>
      _api.uploadMultipart('/admin/media/upload', filePath: filePath);

  Future<List<dynamic>> aiModels({bool activeOnly = false}) => _api.get(
        '/admin/ai-fashion/models',
        query: {if (activeOnly) 'activeOnly': 'true'},
        map: (d) => d as List<dynamic>,
      );

  Future<Map<String, dynamic>> updateAiModel(String id, Map<String, dynamic> body) =>
      _api.patch('/admin/ai-fashion/models/$id', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> generateAi(Map<String, dynamic> body) =>
      _api.post('/admin/ai-fashion/generate', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> aiJob(String id) =>
      _api.get('/admin/ai-fashion/jobs/$id', map: (d) => d as Map<String, dynamic>);

  Future<List<dynamic>> aiJobs({String? productId, int page = 1, int pageSize = 30, String? status}) =>
      _api.get(
        '/admin/ai-fashion/jobs',
        query: {
          'page': page,
          'pageSize': pageSize,
          'productId': ?productId,
          'status': ?status,
        },
        map: (d) => d as List<dynamic>,
      );

  Future<Map<String, dynamic>> aiUsage({int days = 30}) => _api.get(
        '/admin/ai-fashion/usage',
        query: {'days': days},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> createAiModel(Map<String, dynamic> body) =>
      _api.post('/admin/ai-fashion/models', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> generateAiModel(Map<String, dynamic> body) =>
      _api.post('/admin/ai-fashion/models/generate', data: body, map: (d) => d as Map<String, dynamic>);

  Future<void> deleteAiModel(String id) =>
      _api.delete('/admin/ai-fashion/models/$id', map: (_) => true);

  Future<List<dynamic>> employees() =>
      _api.get('/admin/employees', map: (d) => d as List<dynamic>);

  Future<Map<String, dynamic>> createEmployee(Map<String, dynamic> body) =>
      _api.post('/admin/employees', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> updateEmployee(String id, Map<String, dynamic> body) =>
      _api.patch('/admin/employees/$id', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> setEmployeeRoles(String id, List<String> roleCodes) =>
      _api.post(
        '/admin/employees/$id/roles',
        data: {'roleCodes': roleCodes},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<List<dynamic>> roles() =>
      _api.get('/admin/roles', map: (d) => d as List<dynamic>);

  Future<List<dynamic>> permissions() =>
      _api.get('/admin/roles/permissions', map: (d) => d as List<dynamic>);

  Future<Map<String, dynamic>> updateRolePermissions(String id, List<String> permissionCodes) =>
      _api.patch(
        '/admin/roles/$id/permissions',
        data: {'permissionCodes': permissionCodes},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<List<dynamic>> auditLogs({int take = 50, String? q, String? action}) => _api.get(
        '/audit',
        query: {
          'take': take,
          if (q != null && q.isNotEmpty) 'q': q,
          if (action != null && action.isNotEmpty) 'action': action,
        },
        map: (d) => d as List<dynamic>,
      );

  Future<List<dynamic>> brands() =>
      _api.get('/admin/brands', map: (d) => d as List<dynamic>);

  Future<Map<String, dynamic>> approveJob(String id, String as) => _api.post(
        '/admin/ai-fashion/jobs/$id/approve',
        data: {'as': as},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> retryJob(String id) =>
      _api.post('/admin/ai-fashion/jobs/$id/retry', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<void> deleteJob(String id) =>
      _api.delete('/admin/ai-fashion/jobs/$id', map: (_) => true);

  Future<Map<String, dynamic>> aiSettings() =>
      _api.get('/admin/ai-fashion/settings', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> updateAiSettings(Map<String, dynamic> body) =>
      _api.patch('/admin/ai-fashion/settings', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> tryOnDashboard() =>
      _api.get('/admin/ai-fashion/try-on/dashboard', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> tryOnSettings() =>
      _api.get('/admin/ai-fashion/try-on/settings', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> updateTryOnSettings(Map<String, dynamic> body) =>
      _api.patch('/admin/ai-fashion/try-on/settings', data: body, map: (d) => d as Map<String, dynamic>);

  Future<List<dynamic>> tryOnSessions({String? status, int pageSize = 50}) => _api.get(
        '/admin/ai-fashion/try-on',
        query: {
          'pageSize': pageSize,
          if (status != null && status.isNotEmpty) 'status': status,
        },
        map: (d) {
          final map = Map<String, dynamic>.from(d as Map);
          return (map['items'] as List?) ?? [];
        },
      );

  Future<Map<String, dynamic>> retryTryOn(String id) =>
      _api.post('/admin/ai-fashion/try-on/$id/retry', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> cancelTryOn(String id) =>
      _api.post('/admin/ai-fashion/try-on/$id/cancel', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<void> deleteTryOn(String id) =>
      _api.delete('/admin/ai-fashion/try-on/$id', map: (_) => true);

  Future<List<dynamic>> orders() =>
      _api.get('/admin/orders', query: {'pageSize': 30}, map: (d) => d as List<dynamic>);

  Future<Map<String, dynamic>> order(String id) =>
      _api.get('/admin/orders/$id', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> updateOrderStatus(String id, String status, {String? note}) =>
      _api.patch(
        '/admin/orders/$id/status',
        data: {'status': status, if (note != null && note.isNotEmpty) 'note': note},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> verifyPickup(String id, String pickupCode) => _api.post(
        '/admin/orders/$id/pickup/verify',
        data: {'pickupCode': pickupCode},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<void> deleteProduct(String id) =>
      _api.delete('/admin/products/$id', map: (_) => true);

  Future<List<dynamic>> inventory({String? branchId, bool lowStockOnly = false}) => _api.get(
        '/admin/inventory',
        query: {
          if (branchId != null && branchId.isNotEmpty) 'branchId': branchId,
          if (lowStockOnly) 'lowStockOnly': 'true',
        },
        map: (d) => d as List<dynamic>,
      );

  Future<List<dynamic>> branches() =>
      _api.get('/admin/branches', map: (d) => d as List<dynamic>);

  Future<Map<String, dynamic>> adjustInventory({
    required String branchId,
    required String variantId,
    required int qtyDelta,
    String? reason,
  }) =>
      _api.post(
        '/admin/inventory/adjust',
        data: {
          'branchId': branchId,
          'variantId': variantId,
          'qtyDelta': qtyDelta,
          if (reason != null && reason.isNotEmpty) 'reason': reason,
        },
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> createTransfer(Map<String, dynamic> body) =>
      _api.post('/admin/inventory/transfers', data: body, map: (d) => d as Map<String, dynamic>);

  Future<List<dynamic>> customers({String? q}) async {
    final data = await _api.get(
      '/admin/customers',
      query: {'pageSize': 50, if (q != null && q.isNotEmpty) 'q': q},
      map: (d) => d,
    );
    if (data is Map) {
      return (data['items'] as List?) ?? const [];
    }
    return data as List<dynamic>;
  }

  Future<Map<String, dynamic>> customer(String id) =>
      _api.get('/admin/customers/$id', map: (d) => d as Map<String, dynamic>);

  Future<List<dynamic>> campaigns() =>
      _api.get('/admin/campaigns', map: (d) => d as List<dynamic>);

  Future<List<dynamic>> coupons() =>
      _api.get('/admin/coupons', map: (d) => d as List<dynamic>);

  Future<List<dynamic>> segments() =>
      _api.get('/admin/segments', map: (d) => d as List<dynamic>);

  Future<List<dynamic>> abandonedCarts() async {
    final data = await _api.get('/admin/abandoned-cart', map: (d) => d);
    if (data is List) return data;
    if (data is Map) {
      final carts = data['carts'] ?? data['items'] ?? data['abandoned'];
      if (carts is List) return carts;
      return [data];
    }
    return const [];
  }

  Future<Map<String, dynamic>> loyaltyForCustomer(String customerId) =>
      _api.get('/admin/loyalty/$customerId', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> adjustLoyalty(String customerId, {required int delta, required String reason}) =>
      _api.post(
        '/admin/loyalty/$customerId/adjust',
        data: {'delta': delta, 'reason': reason},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> posStatus() =>
      _api.get('/admin/integrations/pos', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> posSync() =>
      _api.post('/admin/integrations/pos/sync/inventory', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> salesReport({String? from, String? to}) => _api.get(
        '/admin/reports/sales',
        query: {
          if (from != null) 'from': from,
          if (to != null) 'to': to,
        },
        map: (d) => d as Map<String, dynamic>,
      );

  Future<List<dynamic>> settings() =>
      _api.get('/settings', map: (d) => d as List<dynamic>);

  Future<Map<String, dynamic>> getSettingsCatalog() =>
      _api.get('/admin/settings/catalog', map: (d) => d as Map<String, dynamic>);

  /// Alias for older call sites.
  Future<Map<String, dynamic>> settingsCatalog() => getSettingsCatalog();

  Future<Map<String, dynamic>> patchSettings(String category, Map<String, dynamic> body) =>
      _api.patch('/admin/settings/$category', data: body, map: (d) => d as Map<String, dynamic>);

  /// Alias for older call sites.
  Future<Map<String, dynamic>> patchSettingsCategory(String category, Map<String, dynamic> body) =>
      patchSettings(category, body);

  Future<Map<String, dynamic>> getDemoDataStatus() =>
      _api.get('/admin/demo-data/status', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> seedDemoData() =>
      _api.post('/admin/demo-data/seed', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> removeDemoData() =>
      _api.post(
        '/admin/demo-data/remove',
        data: {'confirm': 'REMOVE_DEMO_DATA'},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> resetDemoData() =>
      _api.post(
        '/admin/demo-data/reset',
        data: {'confirm': 'RESET_DEMO_DATA'},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> getStorefrontDraft() =>
      _api.get('/settings/storefront/draft', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> getStorefrontLive() =>
      _api.get('/settings/storefront', map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> updateStorefront(
    Map<String, dynamic> body, {
    bool draft = true,
  }) =>
      _api.put(
        '/settings/storefront',
        data: {...body, 'draft': draft},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> publishStorefront() =>
      _api.post('/settings/storefront/publish', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<List<dynamic>> listCollections() =>
      _api.get('/admin/collections', map: (d) => d as List<dynamic>);

  Future<Map<String, dynamic>> createCollection(Map<String, dynamic> body) =>
      _api.post('/admin/collections', data: body, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> setCollectionProducts(String id, List<String> productIds) =>
      _api.put(
        '/admin/collections/$id/products',
        data: {'productIds': productIds},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> listReviews({String? status, int page = 1, int pageSize = 50}) async {
    final data = await _api.get(
      '/admin/reviews',
      query: {
        'page': page,
        'pageSize': pageSize,
        if (status != null && status.isNotEmpty) 'status': status,
      },
      map: (d) => d,
    );
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'items': data is List ? data : const [], 'meta': {}};
  }

  Future<Map<String, dynamic>> moderateReview(String id, String status) =>
      _api.patch(
        '/admin/reviews/$id',
        data: {'status': status},
        map: (d) => d as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> mfaSetup() =>
      _api.post('/auth/mfa/setup', data: {}, map: (d) => d as Map<String, dynamic>);

  Future<Map<String, dynamic>> mfaEnable(String code) =>
      _api.post('/auth/mfa/enable', data: {'code': code}, map: (d) => d as Map<String, dynamic>);

  Future<void> revokeSession(String sessionId) =>
      _api.delete('/auth/sessions/$sessionId', map: (_) => true);

  Future<Map<String, dynamic>> requestPasswordReset(String email) => _api.post(
        '/auth/password/forgot',
        data: {'email': email},
        map: (d) => d is Map<String, dynamic> ? d : <String, dynamic>{},
      );

  Future<void> resetPassword({required String token, required String newPassword}) => _api.post(
        '/auth/password/reset',
        data: {'token': token, 'newPassword': newPassword},
        map: (_) => true,
      );

  Future<void> reauth(String password) => _api.post(
        '/auth/reauth',
        data: {'password': password},
        map: (_) => true,
      );

  Future<List<dynamic>> notifications() =>
      _api.get('/notifications/me', map: (d) => d as List<dynamic>);

  Future<void> changePassword(String current, String next) => _api.post(
        '/auth/change-password',
        data: {'currentPassword': current, 'newPassword': next},
        map: (_) => true,
      );

  Future<void> logoutAll() =>
      _api.post('/auth/logout-all', data: {}, map: (_) => true);

  Future<void> logout(String? refreshToken) async {
    if (refreshToken == null || refreshToken.isEmpty) return;
    try {
      await _api.post('/auth/logout', data: {'refreshToken': refreshToken}, map: (_) => true);
    } catch (_) {}
  }

  Future<List<dynamic>> sessions() =>
      _api.get('/auth/sessions', map: (d) => d as List<dynamic>);

  Future<List<dynamic>> categories() =>
      _api.get('/admin/categories', map: (d) => d as List<dynamic>);

  Future<List<dynamic>> lowStock() => inventory(lowStockOnly: true);
}
