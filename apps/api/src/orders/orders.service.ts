import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CustomersService } from "../customers/customers.service";
import { CartService } from "../cart/cart.service";
import { InventoryService } from "../inventory/inventory.service";
import { AuditService } from "../audit/audit.service";
import { PAYMENT_PROVIDER, PaymentProvider } from "../payments/payment-provider";
import { CouponsService } from "../coupons/coupons.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { NotificationsService } from "../notifications/notifications.service";
import { statusToEventCode } from "../notifications/notification.utils";
import {
  calcLineTotal,
  calcOrderTotals,
  generateOrderNumber,
  generatePickupCode,
  shippingFeeForSubtotal,
} from "../commerce/commerce.utils";
import type { CreateOrderInput } from "@t360/validation";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
    private readonly cart: CartService,
    private readonly inventory: InventoryService,
    private readonly audit: AuditService,
    private readonly coupons: CouponsService,
    private readonly loyalty: LoyaltyService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

  async create(userId: string, input: CreateOrderInput, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({ where: { idempotencyKey } });
      if (existing) return this.getByIdForCustomer(userId, existing.id);
    }

    const customer = await this.customers.requireCustomer(userId);
    const cart = await this.cart.getOrCreateCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException({ code: "EMPTY_CART", message: "Cart is empty" });
    }

    const settings = await this.loadCommerceSettings();
    if (input.paymentMethod === "COD" && !settings.codEnabled) {
      throw new BadRequestException({ code: "COD_DISABLED", message: "COD is not enabled" });
    }

    let addressSnapshot: Prisma.InputJsonValue | undefined;
    if (input.fulfillment === "DELIVERY") {
      if (!input.addressId) {
        throw new BadRequestException({ code: "ADDRESS_REQUIRED", message: "addressId required" });
      }
      const addr = await this.prisma.address.findFirst({
        where: { id: input.addressId, customerId: customer.id, deletedAt: null },
      });
      if (!addr) {
        throw new NotFoundException({ code: "ADDRESS_NOT_FOUND", message: "Address not found" });
      }
      addressSnapshot = {
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
      };
    } else {
      if (!input.branchId) {
        throw new BadRequestException({ code: "BRANCH_REQUIRED", message: "branchId required for pickup" });
      }
    }

    const defaultBranchId = await this.resolveDefaultBranchId();
    const lines = [];
    for (const item of cart.items) {
      const branchId = item.branchId ?? input.branchId ?? defaultBranchId;
      if (!branchId) {
        throw new BadRequestException({ code: "NO_BRANCH", message: "No branch for stock reserve" });
      }
      const unit = Number(item.variant.salePrice ?? item.variant.price);
      lines.push({
        variantId: item.variantId,
        sku: item.variant.sku,
        name: item.variant.product.name,
        qty: item.qty,
        unitPrice: unit,
        lineTotal: calcLineTotal(unit, item.qty),
        branchId,
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const shippingFee =
      input.fulfillment === "DELIVERY"
        ? shippingFeeForSubtotal(subtotal, settings.shippingFee, settings.freeShippingAbove)
        : 0;

    let couponId: string | null = null;
    let couponDiscount = 0;
    if (input.couponCode) {
      const applied = await this.coupons.validateForCustomer(
        input.couponCode,
        subtotal,
        customer.id,
      );
      couponId = applied.coupon.id;
      couponDiscount = applied.discount;
    }

    let loyaltyPoints = 0;
    let loyaltyDiscount = 0;
    if (input.loyaltyPointsToRedeem && input.loyaltyPointsToRedeem > 0) {
      const redeem = await this.loyalty.quoteRedeem(
        customer.id,
        input.loyaltyPointsToRedeem,
        Math.max(0, subtotal - couponDiscount),
      );
      loyaltyPoints = redeem.pointsUsed;
      loyaltyDiscount = redeem.discount;
    }

    const discount = Math.round((couponDiscount + loyaltyDiscount) * 100) / 100;
    const { tax, total } = calcOrderTotals({ subtotal, shippingFee, discount });

    const reservationIds: string[] = [];
    try {
      for (const line of lines) {
        const res = await this.inventory.reserve({
          branchId: line.branchId!,
          variantId: line.variantId,
          qty: line.qty,
          ttlMinutes: 30,
          cartOrOrderRef: "pending",
          actorId: userId,
        });
        reservationIds.push(res.id);
      }
    } catch (e) {
      for (const id of reservationIds) {
        try {
          await this.inventory.releaseReservation(id, userId);
        } catch {
          /* best effort */
        }
      }
      throw e;
    }

    const isCod = input.paymentMethod === "COD";
    const initialStatus = isCod ? "Confirmed" : "PaymentPending";
    const order = await this.prisma.order.create({
      data: {
        number: generateOrderNumber(),
        customerId: customer.id,
        status: initialStatus,
        fulfillment: input.fulfillment,
        branchId: input.branchId ?? null,
        addressSnapshot,
        subtotal,
        discount,
        couponId,
        loyaltyPointsRedeemed: loyaltyPoints,
        shippingFee,
        tax,
        total,
        pickupCode: input.fulfillment === "PICKUP" ? generatePickupCode() : null,
        reservationIds,
        idempotencyKey: idempotencyKey ?? null,
        paymentMethod: input.paymentMethod,
        items: {
          create: lines.map((l) => ({
            variantId: l.variantId,
            sku: l.sku,
            name: l.name,
            qty: l.qty,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
            branchId: l.branchId,
          })),
        },
        events: {
          create: {
            fromStatus: "Pending",
            toStatus: initialStatus,
            actorId: userId,
            note: "Order created",
          },
        },
        shipments:
          input.fulfillment === "DELIVERY"
            ? { create: { status: "pending", fee: shippingFee } }
            : undefined,
      },
    });

    if (couponId && couponDiscount > 0) {
      await this.prisma.couponUsage.create({
        data: {
          couponId,
          customerId: customer.id,
          orderId: order.id,
          amount: couponDiscount,
        },
      });
    }
    if (loyaltyPoints > 0) {
      await this.loyalty.redeem(customer.id, loyaltyPoints, order.id, loyaltyDiscount);
    }

    await this.prisma.stockReservation.updateMany({
      where: { id: { in: reservationIds } },
      data: { cartOrOrderRef: order.id },
    });

    let checkout: Record<string, unknown> | null = null;
    if (isCod) {
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "cod",
          method: "COD",
          status: "pending_collection",
          amount: total,
        },
      });
      for (const id of reservationIds) {
        await this.inventory.commitReservation(id, userId);
      }
      await this.prisma.order.update({
        where: { id: order.id },
        data: { reservationIds: [] },
      });
    } else {
      const amountPaise = Math.round(Number(total) * 100);
      const providerOrder = await this.payments.createOrder({
        amountPaise,
        currency: "INR",
        receipt: order.number,
        notes: { orderId: order.id },
      });
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: this.payments.name,
          providerOrderId: providerOrder.providerOrderId,
          method: "RAZORPAY",
          status: "pending",
          amount: total,
          raw: providerOrder.checkout as object,
        },
      });
      checkout = providerOrder.checkout;
    }

    await this.cart.clear(userId);
    await this.audit.log({
      actorId: userId,
      action: "order.create",
      entityType: "Order",
      entityId: order.id,
    });

    if (initialStatus === "Confirmed") {
      await this.notifyOrderStatus(userId, order.number, Number(order.total), "Confirmed");
    }

    const full = await this.getByIdForCustomer(userId, order.id);
    return { ...full, checkout };
  }

  async listForCustomer(userId: string) {
    const customer = await this.customers.requireCustomer(userId);
    return this.prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, payments: true },
      take: 50,
    });
  }

  async getByIdForCustomer(userId: string, orderId: string) {
    const customer = await this.customers.requireCustomer(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
        payments: true,
        shipments: true,
        refunds: true,
      },
    });
    if (!order) {
      throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found" });
    }
    return order;
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.getByIdForCustomer(userId, orderId);
    if (order.status !== "PaymentPending") {
      throw new BadRequestException({
        code: "NOT_CANCELLABLE",
        message: "Only unpaid orders can be cancelled",
      });
    }
    const reservationIds = (order.reservationIds as string[] | null) ?? [];
    for (const id of reservationIds) {
      try {
        await this.inventory.releaseReservation(id, userId);
      } catch {
        /* already released */
      }
    }
    await this.transition(order.id, order.status, "Cancelled", userId, "Customer cancel");
    await this.prisma.order.update({
      where: { id: order.id },
      data: { reservationIds: [] },
    });
    return this.getByIdForCustomer(userId, orderId);
  }

  async requestReturn(userId: string, orderId: string) {
    const order = await this.getByIdForCustomer(userId, orderId);
    if (order.status !== "Delivered") {
      throw new BadRequestException({ code: "RETURN_NOT_ALLOWED", message: "Only delivered orders" });
    }
    await this.transition(order.id, order.status, "ReturnRequested", userId, "Return requested");
    return this.getByIdForCustomer(userId, orderId);
  }

  async adminList() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, payments: true, customer: true },
    });
  }

  async adminGet(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
        payments: true,
        shipments: true,
        refunds: true,
        customer: true,
      },
    });
    if (!order) {
      throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found" });
    }
    return order;
  }

  async adminUpdateStatus(id: string, status: string, actorId: string, note?: string) {
    const order = await this.adminGet(id);
    if (status === "Returned") {
      await this.restockOrder(order, actorId);
      const payment = order.payments.find((p) => p.status === "captured" || p.method === "COD");
      if (payment?.providerPaymentId && payment.method === "RAZORPAY") {
        await this.transition(id, order.status, "RefundPending", actorId, note);
        const refund = await this.payments.refund({
          providerPaymentId: payment.providerPaymentId,
          amountPaise: Math.round(Number(order.total) * 100),
          idempotencyKey: `refund-${order.id}`,
        });
        await this.prisma.refund.create({
          data: {
            paymentId: payment.id,
            orderId: order.id,
            amount: order.total,
            status: refund.status,
            providerRefundId: refund.providerRefundId,
            idempotencyKey: `refund-${order.id}`,
          },
        });
        await this.transition(id, "RefundPending", "Refunded", actorId, "Refund processed");
        await this.transition(id, "Refunded", "Returned", actorId, "Return complete");
      } else {
        await this.transition(id, order.status, "Returned", actorId, note ?? "Returned");
      }
      return this.adminGet(id);
    }
    await this.transition(id, order.status, status, actorId, note);
    return this.adminGet(id);
  }

  async verifyPickup(id: string, pickupCode: string, actorId: string) {
    const order = await this.adminGet(id);
    if (order.fulfillment !== "PICKUP") {
      throw new BadRequestException({ code: "NOT_PICKUP", message: "Not a pickup order" });
    }
    if (order.pickupVerifiedAt) {
      throw new ConflictException({ code: "PICKUP_USED", message: "Pickup code already used" });
    }
    if (order.pickupCode !== pickupCode) {
      throw new BadRequestException({ code: "INVALID_PICKUP_CODE", message: "Invalid pickup code" });
    }
    await this.prisma.order.update({
      where: { id },
      data: { pickupVerifiedAt: new Date() },
    });
    await this.transition(id, order.status, "Delivered", actorId, "Pickup verified");
    return this.adminGet(id);
  }

  async confirmPaymentByProviderOrderId(
    providerOrderId: string,
    providerPaymentId: string,
    eventId: string,
    raw: unknown,
  ) {
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: this.payments.name, eventId } },
    });
    if (existingEvent?.processedAt) {
      return { duplicate: true };
    }
    await this.prisma.webhookEvent.upsert({
      where: { provider_eventId: { provider: this.payments.name, eventId } },
      create: {
        provider: this.payments.name,
        eventId,
        payload: raw as object,
      },
      update: {},
    });

    const payment = await this.prisma.payment.findFirst({
      where: { providerOrderId },
      include: { order: true },
    });
    if (!payment) {
      throw new NotFoundException({ code: "PAYMENT_NOT_FOUND", message: "Payment not found" });
    }
    if (payment.status === "captured") {
      await this.prisma.webhookEvent.update({
        where: { provider_eventId: { provider: this.payments.name, eventId } },
        data: { processedAt: new Date() },
      });
      return { duplicate: true };
    }

    const reservationIds = (payment.order.reservationIds as string[] | null) ?? [];
    for (const id of reservationIds) {
      await this.inventory.commitReservation(id);
    }
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "captured",
        providerPaymentId,
        raw: raw as object,
      },
    });
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { reservationIds: [] },
    });
    if (payment.order.status === "PaymentPending") {
      await this.transition(payment.orderId, "PaymentPending", "Confirmed", undefined, "Payment captured");
    }
    await this.prisma.webhookEvent.update({
      where: { provider_eventId: { provider: this.payments.name, eventId } },
      data: { processedAt: new Date() },
    });
    return { confirmed: true, orderId: payment.orderId };
  }

  async mockComplete(orderId: string) {
    if (this.payments.name !== "mock") {
      throw new BadRequestException({
        code: "MOCK_ONLY",
        message: "mock-complete only when PAYMENT_PROVIDER=mock",
      });
    }
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, method: "RAZORPAY" },
    });
    if (!payment?.providerOrderId) {
      throw new NotFoundException({ code: "PAYMENT_NOT_FOUND", message: "Payment not found" });
    }
    return this.confirmPaymentByProviderOrderId(
      payment.providerOrderId,
      `mock_pay_${orderId}`,
      `mock_complete_${orderId}`,
      { mock: true },
    );
  }

  async expirePaymentPending() {
    const cutoff = new Date(Date.now() - 35 * 60_000);
    const stale = await this.prisma.order.findMany({
      where: { status: "PaymentPending", createdAt: { lt: cutoff } },
      take: 50,
    });
    for (const order of stale) {
      const reservationIds = (order.reservationIds as string[] | null) ?? [];
      for (const id of reservationIds) {
        try {
          await this.inventory.releaseReservation(id);
        } catch {
          /* ignore */
        }
      }
      await this.transition(order.id, order.status, "Cancelled", undefined, "Payment timeout");
      await this.prisma.order.update({
        where: { id: order.id },
        data: { reservationIds: [] },
      });
    }
    return { cancelled: stale.length };
  }

  private async restockOrder(
    order: { items: Array<{ variantId: string; qty: number; branchId: string | null }> },
    actorId: string,
  ) {
    const defaultBranch = await this.resolveDefaultBranchId();
    for (const item of order.items) {
      const branchId = item.branchId ?? defaultBranch;
      if (!branchId) continue;
      await this.inventory.adjust({
        branchId,
        variantId: item.variantId,
        qtyDelta: item.qty,
        reason: "return restock",
        actorId,
      });
    }
  }

  private async transition(
    orderId: string,
    fromStatus: string,
    toStatus: string,
    actorId?: string,
    note?: string,
  ) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    });
    await this.prisma.orderEvent.create({
      data: { orderId, fromStatus, toStatus, actorId, note },
    });
    if (toStatus === "Delivered") {
      await this.loyalty.earnForOrder(order.customerId, orderId, Number(order.total));
    }
    const customer = await this.prisma.customer.findUnique({
      where: { id: order.customerId },
      select: { userId: true },
    });
    if (customer) {
      await this.notifyOrderStatus(customer.userId, order.number, Number(order.total), toStatus);
    }
  }

  private async notifyOrderStatus(
    userId: string,
    number: string,
    total: number,
    status: string,
  ) {
    const eventCode = statusToEventCode(status);
    if (!eventCode) return;
    try {
      await this.notifications.dispatch({
        userId,
        eventCode,
        data: { number, total },
      });
    } catch {
      /* non-blocking */
    }
  }

  private async loadCommerceSettings() {
    const rows = await this.prisma.systemSetting.findMany({
      where: {
        key: { in: ["commerce.codEnabled", "commerce.shippingFee", "commerce.freeShippingAbove"] },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      codEnabled: Boolean(map["commerce.codEnabled"] ?? true),
      shippingFee: Number(map["commerce.shippingFee"] ?? 49),
      freeShippingAbove: Number(map["commerce.freeShippingAbove"] ?? 999),
    };
  }

  private async resolveDefaultBranchId() {
    const branch = await this.prisma.branch.findFirst({
      where: { deletedAt: null, status: "active" },
      orderBy: { code: "asc" },
    });
    return branch?.id;
  }
}
