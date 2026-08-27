import '../../../core/api_client.dart';

class ProfileDto {
  ProfileDto({required this.id, this.name, this.mobile});

  final String id;
  final String? name;
  final String? mobile;

  factory ProfileDto.fromJson(Map<String, dynamic> j) => ProfileDto(
        id: j['id'] as String,
        name: j['name']?.toString(),
        mobile: j['mobile']?.toString() ?? (j['user'] is Map ? (j['user'] as Map)['mobile']?.toString() : null),
      );
}

class AddressDto {
  AddressDto({
    required this.id,
    required this.label,
    required this.name,
    required this.phone,
    required this.line1,
    required this.city,
    required this.state,
    required this.pincode,
  });

  final String id;
  final String label;
  final String name;
  final String phone;
  final String line1;
  final String city;
  final String state;
  final String pincode;

  factory AddressDto.fromJson(Map<String, dynamic> j) => AddressDto(
        id: j['id'] as String,
        label: j['label']?.toString() ?? 'Home',
        name: j['name']?.toString() ?? '',
        phone: j['phone']?.toString() ?? '',
        line1: j['line1']?.toString() ?? '',
        city: j['city']?.toString() ?? '',
        state: j['state']?.toString() ?? '',
        pincode: j['pincode']?.toString() ?? '',
      );
}

class AccountRepository {
  AccountRepository(this._api);

  final ApiClient _api;

  Future<ProfileDto> me() {
    return _api.get(
      '/customers/me',
      map: (d) => ProfileDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<ProfileDto> updateMe({String? name, String? email}) {
    return _api.patch(
      '/customers/me',
      data: {
        if (name != null) 'name': name,
        if (email != null) 'email': email,
      },
      map: (d) => ProfileDto.fromJson(Map<String, dynamic>.from(d as Map)),
    );
  }

  Future<void> updateProfile(Map<String, dynamic> body) async {
    await _api.patch('/customers/me', data: body, map: (_) => true);
  }

  Future<List<AddressDto>> addresses() {
    return _api.get(
      '/customers/me/addresses',
      map: (data) {
        final list = data is List ? data : [];
        return list
            .whereType<Map>()
            .map((e) => AddressDto.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      },
    );
  }

  Future<void> addAddress(Map<String, dynamic> body) async {
    await _api.post('/customers/me/addresses', data: body, map: (_) => true);
  }

  Future<void> deleteAddress(String id) async {
    await _api.delete('/customers/me/addresses/$id', map: (_) => true);
  }

  Future<int> loyaltyBalance() {
    return _api.get(
      '/loyalty/me',
      map: (d) => (d as Map)['pointsBalance'] as int? ?? 0,
    );
  }

  Future<Map<String, dynamic>> loyaltyMe() {
    return _api.get(
      '/loyalty/me',
      map: (d) => Map<String, dynamic>.from(d as Map),
    );
  }
}
