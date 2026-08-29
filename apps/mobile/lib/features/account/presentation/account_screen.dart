import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../account/data/account_repository.dart';
import '../../../core/providers.dart';
import '../../../core/push_registration.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/presentation/auth_screen.dart';
import '../../repositories.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  final _name = TextEditingController();
  final _addrName = TextEditingController();
  final _phone = TextEditingController();
  final _line1 = TextEditingController();
  final _city = TextEditingController(text: 'Pudukkottai');
  final _state = TextEditingController(text: 'Tamil Nadu');
  final _pincode = TextEditingController(text: '622001');
  int? _loyalty;
  String? _mobile;
  List<AddressDto> _addresses = [];
  var _busy = false;
  String? _error;
  var _marketingEmail = true;
  var _marketingSms = true;
  var _marketingPush = true;
  var _marketingWhatsapp = true;
  var _demoBusy = false;
  String? _demoError;

  @override
  void dispose() {
    _name.dispose();
    _addrName.dispose();
    _phone.dispose();
    _line1.dispose();
    _city.dispose();
    _state.dispose();
    _pincode.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final me = await ref.read(accountRepositoryProvider).me();
      final addrs = await ref.read(accountRepositoryProvider).addresses();
      final loyalty = await ref.read(accountRepositoryProvider).loyaltyBalance();
      final prefs = await ref.read(notificationsRepositoryProvider).prefs();
      setState(() {
        _name.text = me.name ?? '';
        _mobile = me.mobile;
        _addresses = addrs;
        _loyalty = loyalty;
        _marketingEmail = prefs.marketingEmail;
        _marketingSms = prefs.marketingSms;
        _marketingPush = prefs.marketingPush;
        _marketingWhatsapp = prefs.marketingWhatsapp;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _demoSignIn(String role) async {
    setState(() {
      _demoBusy = true;
      _demoError = null;
    });
    try {
      final result = await ref.read(authRepositoryProvider).demoSignIn(role);
      await ref.read(tokenStorageProvider).saveTokens(
            access: result.access,
            refresh: result.refresh,
          );
      await ref.read(authStateProvider.notifier).markLoggedIn(staff: role == 'staff');
      if (!mounted) return;
      if (role == 'staff') {
        context.go('/admin');
      } else if (result.isNewCustomer) {
        context.go('/account/complete-profile');
      } else {
        await _load();
      }
    } catch (e) {
      setState(() => _demoError = mapAuthError(e));
    } finally {
      if (mounted) setState(() => _demoBusy = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authStateProvider).isLoggedIn) {
        _load();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authStateProvider);

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: TharagaiAppBar(title: t.account),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TharagaiButton(
                  label: t.loginRequired,
                  onPressed: () => context.push('/auth'),
                ),
                const SizedBox(height: 12),
                TharagaiButton(
                  label: 'Staff admin login',
                  variant: TharagaiButtonVariant.outline,
                  onPressed: () => context.push('/admin/login'),
                ),
                const SizedBox(height: 28),
                const SocialConnectRow(),
                const SizedBox(height: 24),
                Text(
                  'Quick demo (remove before production)',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                TharagaiButton(
                  label: _demoBusy ? 'Signing in…' : 'Demo customer login',
                  variant: TharagaiButtonVariant.outline,
                  onPressed: _demoBusy ? null : () => _demoSignIn('customer'),
                ),
                const SizedBox(height: 8),
                TharagaiButton(
                  label: _demoBusy ? 'Signing in…' : 'Demo admin login',
                  variant: TharagaiButtonVariant.outline,
                  onPressed: _demoBusy ? null : () => _demoSignIn('staff'),
                ),
                if (_demoError != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _demoError!,
                    style: const TextStyle(color: TharagaiColors.wine),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: TharagaiAppBar(title: t.account),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null)
            Text(_error!, style: const TextStyle(color: TharagaiColors.wine)),
          if (_mobile != null) Text(_mobile!),
          if (_loyalty != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('${t.loyaltyBalance}: $_loyalty ${t.loyaltyPoints}'),
            ),
          const SizedBox(height: 8),
          const SocialConnectRow(),
          const SizedBox(height: 16),
          TharagaiButton(
            label: t.loyaltyHub,
            variant: TharagaiButtonVariant.outline,
            onPressed: () => context.push('/loyalty'),
          ),
          const SizedBox(height: 8),
          TharagaiButton(
            label: t.wishlist,
            variant: TharagaiButtonVariant.outline,
            onPressed: () => context.push('/wishlist'),
          ),
          const SizedBox(height: 8),
          TharagaiButton(
            label: t.cart,
            variant: TharagaiButtonVariant.outline,
            onPressed: () => context.push('/cart'),
          ),
          const SizedBox(height: 8),
          TharagaiInput(label: t.name, controller: _name),
          const SizedBox(height: 8),
          TharagaiButton(
            label: t.save,
            onPressed: _busy
                ? null
                : () async {
                    setState(() => _busy = true);
                    try {
                      await ref.read(accountRepositoryProvider).updateMe(name: _name.text.trim());
                    } catch (e) {
                      setState(() => _error = e.toString());
                    } finally {
                      setState(() => _busy = false);
                    }
                  },
          ),
          const SizedBox(height: 16),
          TharagaiButton(
            label: t.orders,
            variant: TharagaiButtonVariant.outline,
            onPressed: () => context.push('/orders'),
          ),
          const SizedBox(height: 8),
          TharagaiButton(
            label: t.tryMeHistory,
            variant: TharagaiButtonVariant.outline,
            onPressed: () => context.push('/try-ons'),
          ),
          const SizedBox(height: 8),
          TharagaiButton(
            label: t.openAi,
            variant: TharagaiButtonVariant.outline,
            onPressed: () => context.push('/ai'),
          ),
          const SizedBox(height: 16),
          Text(t.notifications, style: Theme.of(context).textTheme.titleMedium),
          Text(t.notificationPrefs, style: const TextStyle(color: TharagaiColors.muted)),
          SwitchListTile(
            title: Text(t.prefEmail),
            value: _marketingEmail,
            onChanged: (v) async {
              setState(() => _marketingEmail = v);
              await ref
                  .read(notificationsRepositoryProvider)
                  .updatePrefs({'marketingEmail': v});
            },
          ),
          SwitchListTile(
            title: Text(t.prefSms),
            value: _marketingSms,
            onChanged: (v) async {
              setState(() => _marketingSms = v);
              await ref.read(notificationsRepositoryProvider).updatePrefs({'marketingSms': v});
            },
          ),
          SwitchListTile(
            title: Text(t.prefPush),
            value: _marketingPush,
            onChanged: (v) async {
              setState(() => _marketingPush = v);
              await ref.read(notificationsRepositoryProvider).updatePrefs({'marketingPush': v});
            },
          ),
          SwitchListTile(
            title: Text(t.prefWhatsapp),
            value: _marketingWhatsapp,
            onChanged: (v) async {
              setState(() => _marketingWhatsapp = v);
              await ref
                  .read(notificationsRepositoryProvider)
                  .updatePrefs({'marketingWhatsapp': v});
            },
          ),
          TharagaiButton(
            label: t.registerDevice,
            variant: TharagaiButtonVariant.outline,
            onPressed: () async {
              try {
                final token = await ref.read(pushRegistrationProvider).register();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Device registered ($token)')),
                  );
                }
                setState(() => _error = null);
              } catch (e) {
                setState(() => _error = e.toString());
              }
            },
          ),
          const SizedBox(height: 8),
          if (!kReleaseMode) ...[
            TharagaiButton(
              label: t.gallery,
              variant: TharagaiButtonVariant.outline,
              onPressed: () => context.push('/gallery'),
            ),
            const SizedBox(height: 8),
          ],
          TharagaiButton(
            label: t.localeToggle,
            variant: TharagaiButtonVariant.outline,
            onPressed: () => ref.read(localeProvider.notifier).toggle(),
          ),
          const SizedBox(height: 24),
          Text(t.addresses, style: Theme.of(context).textTheme.titleMedium),
          for (final a in _addresses)
            ListTile(
              title: Text('${a.label} — ${a.name}'),
              subtitle: Text('${a.line1}, ${a.city}'),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () async {
                  await ref.read(accountRepositoryProvider).deleteAddress(a.id);
                  await _load();
                },
              ),
            ),
          TharagaiInput(label: t.name, controller: _addrName),
          TharagaiInput(label: t.phone, controller: _phone, keyboardType: TextInputType.phone),
          TharagaiInput(label: t.line1, controller: _line1),
          TharagaiInput(label: t.city, controller: _city),
          TharagaiInput(label: t.state, controller: _state),
          TharagaiInput(label: t.pincode, controller: _pincode),
          const SizedBox(height: 8),
          TharagaiButton(
            label: t.addAddress,
            onPressed: _busy
                ? null
                : () async {
                    setState(() => _busy = true);
                    try {
                      await ref.read(accountRepositoryProvider).addAddress({
                        'name': _addrName.text.trim(),
                        'phone': _phone.text.trim(),
                        'line1': _line1.text.trim(),
                        'city': _city.text.trim(),
                        'state': _state.text.trim(),
                        'pincode': _pincode.text.trim(),
                      });
                      await _load();
                    } catch (e) {
                      setState(() => _error = e.toString());
                    } finally {
                      setState(() => _busy = false);
                    }
                  },
          ),
          const SizedBox(height: 24),
          TharagaiButton(
            label: t.logout,
            variant: TharagaiButtonVariant.outline,
            onPressed: () async {
              final refresh = await ref.read(tokenStorageProvider).getRefresh();
              await ref.read(authRepositoryProvider).logout(refresh);
              await ref.read(authStateProvider.notifier).markLoggedOut();
              if (context.mounted) context.go('/');
            },
          ),
          const SizedBox(height: 8),
          TharagaiButton(
            label: 'Logout all devices',
            variant: TharagaiButtonVariant.outline,
            onPressed: () async {
              await ref.read(authRepositoryProvider).logoutAll();
              await ref.read(authStateProvider.notifier).markLoggedOut();
              if (context.mounted) context.go('/');
            },
          ),
        ],
      ),
    );
  }
}
