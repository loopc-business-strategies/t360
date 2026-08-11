import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../core/providers.dart';
import '../../../design_system/design_system.dart';
import '../../../l10n/app_strings.dart';
import '../../repositories.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  var _fulfillment = 'DELIVERY';
  var _payment = 'RAZORPAY';
  String? _addressId;
  String? _branchId;
  final _coupon = TextEditingController();
  final _loyalty = TextEditingController();
  String? _appliedCoupon;
  double _couponDiscount = 0;
  double _subtotal = 0;
  double _shippingFee = 49;
  double _freeAbove = 999;
  var _codEnabled = true;
  var _provider = 'mock';
  var _loyaltyBalance = 0;
  var _busy = false;
  String? _error;
  List<({String id, String label})> _addresses = [];
  List<({String id, String label})> _branches = [];
  Razorpay? _razorpay;
  String? _pendingOrderId;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _coupon.dispose();
    _loyalty.dispose();
    _razorpay?.clear();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final cart = await ref.read(cartRepositoryProvider).getCart();
      final addrs = await ref.read(accountRepositoryProvider).addresses();
      final branches = await ref.read(catalogRepositoryProvider).branches();
      final sf = await ref.read(catalogRepositoryProvider).storefront();
      final loyalty = await ref.read(accountRepositoryProvider).loyaltyBalance();
      final commerce = sf['commerce'] as Map?;
      setState(() {
        _subtotal = cart.subtotal;
        _addresses = addrs
            .map((a) => (id: a.id, label: '${a.label} — ${a.line1}, ${a.city}'))
            .toList();
        _addressId = addrs.isNotEmpty ? addrs.first.id : null;
        _branches = branches.map((b) => (id: b.id, label: '${b.code} — ${b.name}')).toList();
        _branchId = branches.isNotEmpty ? branches.first.id : null;
        _loyaltyBalance = loyalty;
        if (commerce != null) {
          _codEnabled = commerce['codEnabled'] as bool? ?? true;
          _shippingFee = (commerce['shippingFee'] as num?)?.toDouble() ?? 49;
          _freeAbove = (commerce['freeShippingAbove'] as num?)?.toDouble() ?? 999;
          _provider = commerce['paymentProvider']?.toString() ?? 'mock';
        }
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _applyCoupon() async {
    try {
      final d = await ref.read(ordersRepositoryProvider).validateCoupon(
            _coupon.text.trim(),
            _subtotal,
          );
      setState(() {
        _appliedCoupon = _coupon.text.trim().toUpperCase();
        _couponDiscount = d;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _appliedCoupon = null;
        _couponDiscount = 0;
        _error = e.toString();
      });
    }
  }

  Future<void> _placeOrder() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final redeem = int.tryParse(_loyalty.text.trim()) ?? 0;
      final order = await ref.read(ordersRepositoryProvider).create(
            fulfillment: _fulfillment,
            paymentMethod: _payment,
            addressId: _fulfillment == 'DELIVERY' ? _addressId : null,
            branchId: _fulfillment == 'PICKUP' ? _branchId : null,
            couponCode: _appliedCoupon,
            loyaltyPointsToRedeem: redeem > 0 ? redeem : null,
            idempotencyKey: DateTime.now().microsecondsSinceEpoch.toString(),
          );
      final orderId = order['id'] as String;
      if (_payment == 'COD') {
        if (mounted) context.go('/orders/$orderId');
        return;
      }
      if (_provider == 'mock' || (order['checkout'] is Map && (order['checkout'] as Map)['provider'] == 'mock')) {
        await ref.read(ordersRepositoryProvider).mockComplete(orderId);
        if (mounted) context.go('/orders/$orderId');
        return;
      }
      final checkout = order['checkout'] as Map?;
      if (checkout == null) {
        throw Exception('Missing checkout payload');
      }
      _pendingOrderId = orderId;
      _razorpay ??= Razorpay();
      _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, (_) {
        if (_pendingOrderId != null && mounted) {
          context.go('/orders/$_pendingOrderId');
        }
      });
      _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, (res) {
        setState(() => _error = res.message?.toString() ?? 'Payment failed');
      });
      _razorpay!.open({
        'key': checkout['key'] ?? const String.fromEnvironment('RAZORPAY_KEY_ID'),
        'amount': checkout['amount'],
        'currency': checkout['currency'] ?? 'INR',
        'order_id': checkout['orderId'],
        'name': 'THARAGAI',
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authStateProvider);
    if (!auth.isLoggedIn) {
      return Scaffold(
        body: Center(
          child: TharagaiButton(
            label: t.loginRequired,
            onPressed: () => context.go('/auth?redirect=/checkout'),
          ),
        ),
      );
    }

    final ship = _fulfillment == 'DELIVERY'
        ? (_subtotal >= _freeAbove ? 0.0 : _shippingFee)
        : 0.0;
    final redeemPts = int.tryParse(_loyalty.text.trim()) ?? 0;
    final estLoyalty = (redeemPts * 0.25).clamp(0, (_subtotal - _couponDiscount) * 0.2);
    final discount = _couponDiscount + estLoyalty;
    final total = (_subtotal - discount).clamp(0, double.infinity) + ship;

    return Scaffold(
      appBar: TharagaiAppBar(title: t.checkout),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null)
            Text(_error!, style: const TextStyle(color: TharagaiColors.wine)),
          Text(t.delivery),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: Text(t.delivery),
                selected: _fulfillment == 'DELIVERY',
                onSelected: (_) => setState(() => _fulfillment = 'DELIVERY'),
              ),
              ChoiceChip(
                label: Text(t.pickup),
                selected: _fulfillment == 'PICKUP',
                onSelected: (_) => setState(() => _fulfillment = 'PICKUP'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_fulfillment == 'DELIVERY') ...[
            Text(t.selectAddress),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final a in _addresses)
                  ChoiceChip(
                    label: Text(a.label, overflow: TextOverflow.ellipsis),
                    selected: _addressId == a.id,
                    onSelected: (_) => setState(() => _addressId = a.id),
                  ),
              ],
            ),
          ] else ...[
            Text(t.branch),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final b in _branches)
                  ChoiceChip(
                    label: Text(b.label),
                    selected: _branchId == b.id,
                    onSelected: (_) => setState(() => _branchId = b.id),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Text('Payment'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: Text(_provider == 'mock' ? t.payMock : t.payOnline),
                selected: _payment == 'RAZORPAY',
                onSelected: (_) => setState(() => _payment = 'RAZORPAY'),
              ),
              if (_codEnabled)
                ChoiceChip(
                  label: Text(t.payCod),
                  selected: _payment == 'COD',
                  onSelected: (_) => setState(() => _payment = 'COD'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: TharagaiInput(label: t.couponCode, controller: _coupon)),
              const SizedBox(width: 8),
              TharagaiButton(
                label: t.applyCoupon,
                variant: TharagaiButtonVariant.outline,
                onPressed: _applyCoupon,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text('${t.loyaltyBalance}: $_loyaltyBalance ${t.loyaltyPoints}'),
          TharagaiInput(
            label: t.redeemPoints,
            controller: _loyalty,
            keyboardType: TextInputType.number,
            onChanged: (value) => setState(() {}),
          ),
          const SizedBox(height: 16),
          Text('Subtotal: ₹$_subtotal'),
          if (discount > 0) Text('${t.discount}: −₹${discount.toStringAsFixed(2)}'),
          Text('${t.shipping}: ₹$ship'),
          Text('${t.orderTotal}: ₹${total.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          TharagaiButton(
            label: t.placeOrder,
            onPressed: _busy ? null : _placeOrder,
          ),
        ],
      ),
    );
  }
}
