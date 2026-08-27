"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, LoadingState, Select } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../lib/api";
import { fetchBranches, fetchStorefront } from "../../lib/catalog-api";
import { useLocale } from "../../lib/locale";

type Address = { id: string; label: string; line1: string; city: string; pincode: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [fulfillment, setFulfillment] = React.useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = React.useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [addressId, setAddressId] = React.useState("");
  const [branches, setBranches] = React.useState<Array<{ id: string; code: string; name: string }>>([]);
  const [branchId, setBranchId] = React.useState("");
  const [codEnabled, setCodEnabled] = React.useState(true);
  const [provider, setProvider] = React.useState("mock");
  const [subtotal, setSubtotal] = React.useState(0);
  const [shippingFee, setShippingFee] = React.useState(49);
  const [freeAbove, setFreeAbove] = React.useState(999);
  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = React.useState(0);
  const [loyaltyBalance, setLoyaltyBalance] = React.useState(0);
  const [loyaltyRedeem, setLoyaltyRedeem] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!getCustomerToken()) {
      router.replace("/account?redirect=/checkout");
      return;
    }
    void (async () => {
      const [cart, addrs, br, sf, loyalty] = await Promise.all([
        apiFetch<{ subtotal: number; items: unknown[] }>("/cart"),
        apiFetch<Address[]>("/customers/me/addresses"),
        fetchBranches(),
        fetchStorefront(),
        apiFetch<{ pointsBalance: number }>("/loyalty/me"),
      ]);
      if (!cart.data.items.length) {
        router.replace("/cart");
        return;
      }
      setSubtotal(cart.data.subtotal);
      setAddresses(addrs.data);
      setAddressId(addrs.data[0]?.id ?? "");
      setBranches(br.data);
      setBranchId(br.data[0]?.id ?? "");
      setLoyaltyBalance(loyalty.data.pointsBalance);
      const c = sf.data.commerce;
      if (c) {
        setCodEnabled(c.codEnabled);
        setShippingFee(c.shippingFee);
        setFreeAbove(c.freeShippingAbove);
        setProvider(c.paymentProvider ?? "mock");
      }
      setReady(true);
    })().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [router]);

  const ship = fulfillment === "DELIVERY" ? (subtotal >= freeAbove ? 0 : shippingFee) : 0;
  const redeemPts = Math.max(0, Math.min(Number(loyaltyRedeem) || 0, loyaltyBalance));
  const estimatedLoyaltyDiscount = Math.min(
    Math.round(redeemPts * 0.25 * 100) / 100,
    Math.round(((subtotal - couponDiscount) * 0.2) * 100) / 100,
    Math.max(0, subtotal - couponDiscount),
  );
  const discount = couponDiscount + estimatedLoyaltyDiscount;
  const total = Math.max(0, subtotal - discount) + ship;

  async function applyCoupon() {
    setError(null);
    try {
      const res = await apiFetch<{ code: string; discount: number }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      setAppliedCoupon(res.data.code);
      setCouponDiscount(res.data.discount);
    } catch (e) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setError(e instanceof Error ? e.message : "Coupon failed");
    }
  }

  async function placeOrder() {
    setBusy(true);
    setError(null);
    try {
      const key = crypto.randomUUID();
      const res = await apiFetch<{
        id: string;
        checkout?: { provider?: string; key?: string; orderId?: string; amount?: number; currency?: string };
      }>("/orders", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({
          fulfillment,
          paymentMethod,
          addressId: fulfillment === "DELIVERY" ? addressId : undefined,
          branchId: fulfillment === "PICKUP" ? branchId : undefined,
          couponCode: appliedCoupon ?? undefined,
          loyaltyPointsToRedeem: redeemPts > 0 ? redeemPts : undefined,
        }),
      });
      if (paymentMethod === "COD") {
        router.push(`/orders/${res.data.id}`);
        return;
      }
      if (provider === "mock" || res.data.checkout?.provider === "mock") {
        await apiFetch(`/payments/${res.data.id}/mock-complete`, { method: "POST" });
        router.push(`/orders/${res.data.id}`);
        return;
      }
      await loadRazorpay();
      const checkout = res.data.checkout;
      if (!checkout?.orderId || !window.Razorpay) {
        throw new Error("Razorpay checkout unavailable");
      }
      const rzp = new window.Razorpay({
        key: checkout.key ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: checkout.amount,
        currency: checkout.currency ?? "INR",
        order_id: checkout.orderId,
        handler: () => {
          router.push(`/orders/${res.data.id}`);
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <LoadingState label={t.loading} />;

  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-12">
      <h1 className="font-display text-3xl">{t.checkout}</h1>
      {error ? <p className="text-sm text-wine">{error}</p> : null}

      <Select
        label="Fulfillment"
        value={fulfillment}
        onValueChange={(v) => setFulfillment(v as "DELIVERY" | "PICKUP")}
        options={[
          { value: "DELIVERY", label: t.delivery },
          { value: "PICKUP", label: t.pickup },
        ]}
      />

      {fulfillment === "DELIVERY" ? (
        addresses.length ? (
          <Select
            label={t.selectAddress}
            value={addressId}
            onValueChange={setAddressId}
            options={addresses.map((a) => ({
              value: a.id,
              label: `${a.label} — ${a.line1}, ${a.city}`,
            }))}
          />
        ) : (
          <p className="text-sm">
            <Link href="/account" className="text-wine hover:underline">
              {t.addAddress}
            </Link>
          </p>
        )
      ) : (
        <Select
          label={t.branch}
          value={branchId}
          onValueChange={setBranchId}
          options={branches.map((b) => ({ value: b.id, label: `${b.code} — ${b.name}` }))}
        />
      )}

      <Select
        label="Payment"
        value={paymentMethod}
        onValueChange={(v) => setPaymentMethod(v as "RAZORPAY" | "COD")}
        options={[
          { value: "RAZORPAY", label: provider === "mock" ? t.payMock : t.payOnline },
          ...(codEnabled ? [{ value: "COD", label: t.payCod }] : []),
        ]}
      />

      <div className="flex flex-wrap items-end gap-2">
        <Input
          label={t.couponCode}
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={() => void applyCoupon()}>
          {t.applyCoupon}
        </Button>
      </div>
      {appliedCoupon ? (
        <p className="text-sm text-muted">
          {appliedCoupon}: −₹{couponDiscount}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm text-muted">
          {t.loyaltyBalance}: {loyaltyBalance} {t.loyaltyPoints}
        </p>
        <Input
          label={t.redeemPoints}
          value={loyaltyRedeem}
          onChange={(e) => setLoyaltyRedeem(e.target.value)}
        />
      </div>

      <div className="space-y-1 text-sm">
        <p>Subtotal: ₹{subtotal}</p>
        {discount > 0 ? (
          <p>
            {t.discount}: −₹{discount}
          </p>
        ) : null}
        <p>
          {t.shipping}: ₹{ship}
        </p>
        <p className="text-lg font-medium">
          {t.orderTotal}: ₹{total}
        </p>
      </div>

      <Button
        type="button"
        disabled={busy || (fulfillment === "DELIVERY" && !addressId) || (fulfillment === "PICKUP" && !branchId)}
        onClick={() => void placeOrder()}
      >
        {t.placeOrder}
      </Button>
    </main>
  );
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}
