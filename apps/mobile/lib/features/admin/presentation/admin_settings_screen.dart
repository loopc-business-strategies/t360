import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api_exception.dart';
import 'admin_home_screen.dart';

class AdminSettingsScreen extends ConsumerStatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  ConsumerState<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends ConsumerState<AdminSettingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic>? _catalog;
  String? _error;
  bool _loading = true;
  bool _saving = false;

  final _businessName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _timezone = TextEditingController();
  final _currency = TextEditingController();
  final _language = TextEditingController();
  final _shippingFee = TextEditingController();
  final _freeShipping = TextEditingController();
  final _maxUpload = TextEditingController();
  bool _codEnabled = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _businessName.dispose();
    _phone.dispose();
    _email.dispose();
    _address.dispose();
    _timezone.dispose();
    _currency.dispose();
    _language.dispose();
    _shippingFee.dispose();
    _freeShipping.dispose();
    _maxUpload.dispose();
    super.dispose();
  }

  Map<String, dynamic>? _category(String id) {
    final cats = (_catalog?['categories'] as List?) ?? [];
    for (final c in cats) {
      if (c is Map && c['id'] == id) return Map<String, dynamic>.from(c);
    }
    return null;
  }

  dynamic _fieldValue(String categoryId, String key) {
    final cat = _category(categoryId);
    final fields = (cat?['fields'] as List?) ?? [];
    for (final f in fields) {
      if (f is Map && f['key'] == key) return f['value'];
    }
    return null;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final catalog = await ref.read(adminRepoProvider).getSettingsCatalog();
      if (!mounted) return;
      setState(() {
        _catalog = catalog;
        _businessName.text = '${_fieldValue('general', 'business.name') ?? ''}';
        _phone.text = '${_fieldValue('general', 'business.phone') ?? ''}';
        _email.text = '${_fieldValue('general', 'business.email') ?? ''}';
        _address.text = '${_fieldValue('general', 'business.address') ?? ''}';
        _timezone.text = '${_fieldValue('general', 'business.timezone') ?? 'Asia/Kolkata'}';
        _currency.text = '${_fieldValue('general', 'business.currency') ?? 'INR'}';
        _language.text = '${_fieldValue('general', 'business.language') ?? 'en'}';
        _codEnabled = _fieldValue('commerce', 'commerce.codEnabled') == true;
        _shippingFee.text = '${_fieldValue('commerce', 'commerce.shippingFee') ?? 49}';
        _freeShipping.text = '${_fieldValue('commerce', 'commerce.freeShippingAbove') ?? 999}';
        _maxUpload.text = '${_fieldValue('storage', 'media.maxUploadBytes') ?? 12000000}';
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

  Future<void> _save(String category, Map<String, dynamic> body) async {
    setState(() => _saving = true);
    try {
      await ref.read(adminRepoProvider).patchSettings(category, body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved')),
        );
        await _load();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final system = _category('system');
    final status = system?['status'] as Map?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: const [
            Tab(text: 'General'),
            Tab(text: 'Commerce'),
            Tab(text: 'Storage'),
            Tab(text: 'System'),
          ],
        ),
        actions: [
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
              : TabBarView(
                  controller: _tabs,
                  children: [
                    ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        TextField(
                          controller: _businessName,
                          decoration: const InputDecoration(labelText: 'Store name'),
                        ),
                        TextField(
                          controller: _phone,
                          decoration: const InputDecoration(labelText: 'Phone'),
                        ),
                        TextField(
                          controller: _email,
                          decoration: const InputDecoration(labelText: 'Email'),
                        ),
                        TextField(
                          controller: _address,
                          decoration: const InputDecoration(labelText: 'Address'),
                          maxLines: 2,
                        ),
                        TextField(
                          controller: _timezone,
                          decoration: const InputDecoration(labelText: 'Timezone'),
                        ),
                        TextField(
                          controller: _currency,
                          decoration: const InputDecoration(labelText: 'Currency'),
                        ),
                        TextField(
                          controller: _language,
                          decoration: const InputDecoration(labelText: 'Language'),
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: _saving
                              ? null
                              : () => _save('general', {
                                    'businessName': _businessName.text.trim(),
                                    'phone': _phone.text.trim(),
                                    'email': _email.text.trim().isEmpty
                                        ? null
                                        : _email.text.trim(),
                                    'address': _address.text.trim(),
                                    'timezone': _timezone.text.trim(),
                                    'currency': _currency.text.trim(),
                                    'language': _language.text.trim(),
                                  }),
                          child: Text(_saving ? 'Saving…' : 'Save general'),
                        ),
                        TextButton(
                          onPressed: () => context.push('/admin/ai-settings'),
                          child: const Text('AI Fashion settings'),
                        ),
                        TextButton(
                          onPressed: () => context.push('/admin/try-on'),
                          child: const Text('TRY ME settings'),
                        ),
                      ],
                    ),
                    ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Cash on delivery'),
                          value: _codEnabled,
                          onChanged: (v) => setState(() => _codEnabled = v),
                        ),
                        TextField(
                          controller: _shippingFee,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Shipping fee (₹)'),
                        ),
                        TextField(
                          controller: _freeShipping,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Free shipping above (₹)'),
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: _saving
                              ? null
                              : () => _save('commerce', {
                                    'codEnabled': _codEnabled,
                                    'shippingFee':
                                        double.tryParse(_shippingFee.text.trim()) ?? 49,
                                    'freeShippingAbove':
                                        double.tryParse(_freeShipping.text.trim()) ?? 999,
                                  }),
                          child: Text(_saving ? 'Saving…' : 'Save commerce'),
                        ),
                      ],
                    ),
                    ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Text(
                          'Cloudinary secrets stay on the API. Only upload limits are editable here.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _maxUpload,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Max upload bytes'),
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: _saving
                              ? null
                              : () => _save('storage', {
                                    'maxUploadBytes':
                                        int.tryParse(_maxUpload.text.trim()) ?? 12000000,
                                  }),
                          child: Text(_saving ? 'Saving…' : 'Save storage'),
                        ),
                      ],
                    ),
                    ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Overall'),
                          trailing: Text('${status?['overall'] ?? '—'}'),
                        ),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Database'),
                          trailing: Text('${status?['database'] ?? '—'}'),
                        ),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Redis'),
                          trailing: Text('${status?['redis'] ?? '—'}'),
                        ),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Storage'),
                          trailing: Text(
                            '${(status?['storage'] as Map?)?['provider'] ?? '—'}',
                          ),
                        ),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Fashion AI'),
                          trailing: Text(
                            '${(status?['fashionAi'] as Map?)?['provider'] ?? '—'} '
                            '(${(status?['fashionAi'] as Map?)?['configured'] == true ? 'configured' : 'not configured'})',
                          ),
                        ),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('App version'),
                          trailing: Text('${status?['appVersion'] ?? '—'}'),
                        ),
                        const Divider(),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Profile / security'),
                          subtitle: const Text('Password & sessions'),
                          onTap: () => context.push('/admin/profile'),
                        ),
                      ],
                    ),
                  ],
                ),
    );
  }
}
