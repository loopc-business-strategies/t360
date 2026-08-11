import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { SegmentRules } from "@t360/validation";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { MarketingQueueService } from "./marketing-queue.service";
import { matchesSegmentRules, type CustomerStats } from "./segment.utils";

@Injectable()
export class MarketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly queue: MarketingQueueService,
  ) {}

  listSegments() {
    return this.prisma.segment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSegment(
    input: { name: string; rules: SegmentRules; active?: boolean },
    actorId?: string,
  ) {
    const row = await this.prisma.segment.create({
      data: {
        name: input.name,
        rules: input.rules as object,
        active: input.active ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: "segment.create",
      entityType: "Segment",
      entityId: row.id,
    });
    return row;
  }

  async updateSegment(
    id: string,
    input: { name?: string; rules?: SegmentRules; active?: boolean },
    actorId?: string,
  ) {
    const row = await this.prisma.segment.update({
      where: { id },
      data: {
        name: input.name,
        rules: input.rules === undefined ? undefined : (input.rules as object),
        active: input.active,
      },
    });
    await this.audit.log({
      actorId,
      action: "segment.update",
      entityType: "Segment",
      entityId: id,
    });
    return row;
  }

  async previewSegment(id: string) {
    const segment = await this.prisma.segment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!segment) {
      throw new NotFoundException({ code: "SEGMENT_NOT_FOUND", message: "Segment not found" });
    }
    const members = await this.resolveSegmentMembers(segment.rules as SegmentRules);
    return { count: members.length };
  }

  listCampaigns() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { segment: true, _count: { select: { recipients: true } } },
      take: 100,
    });
  }

  async createCampaign(
    input: {
      name: string;
      channels: string[];
      segmentId?: string | null;
      couponCode?: string | null;
      subject?: string | null;
      body: string;
      scheduledAt?: string | null;
      status?: string;
    },
    actorId?: string,
  ) {
    const row = await this.prisma.campaign.create({
      data: {
        name: input.name,
        channels: input.channels,
        segmentId: input.segmentId ?? null,
        couponCode: input.couponCode ?? null,
        subject: input.subject ?? null,
        body: input.body,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: input.status ?? "draft",
      },
    });
    await this.audit.log({
      actorId,
      action: "campaign.create",
      entityType: "Campaign",
      entityId: row.id,
    });
    return row;
  }

  async updateCampaign(
    id: string,
    input: Partial<{
      name: string;
      channels: string[];
      segmentId: string | null;
      couponCode: string | null;
      subject: string | null;
      body: string;
      scheduledAt: string | null;
      status: string;
    }>,
    actorId?: string,
  ) {
    const row = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: input.name,
        channels: input.channels,
        segmentId: input.segmentId === undefined ? undefined : input.segmentId,
        couponCode: input.couponCode === undefined ? undefined : input.couponCode,
        subject: input.subject === undefined ? undefined : input.subject,
        body: input.body,
        scheduledAt:
          input.scheduledAt === undefined
            ? undefined
            : input.scheduledAt
              ? new Date(input.scheduledAt)
              : null,
        status: input.status,
      },
    });
    await this.audit.log({
      actorId,
      action: "campaign.update",
      entityType: "Campaign",
      entityId: id,
    });
    return row;
  }

  async enqueueCampaign(id: string, actorId?: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { segment: true },
    });
    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" });
    }
    if (campaign.status === "running") {
      throw new BadRequestException({ code: "CAMPAIGN_RUNNING", message: "Already running" });
    }

    const rules = (campaign.segment?.rules ?? {}) as SegmentRules;
    const members = campaign.segmentId
      ? await this.resolveSegmentMembers(rules)
      : await this.allCustomerUserIds();

    await this.prisma.campaign.update({
      where: { id },
      data: { status: "running", startedAt: new Date() },
    });

    let created = 0;
    for (const userId of members) {
      const recipient = await this.prisma.campaignRecipient.upsert({
        where: { campaignId_userId: { campaignId: id, userId } },
        create: { campaignId: id, userId, status: "pending" },
        update: { status: "pending" },
      });
      await this.queue.enqueueCampaignRecipient(recipient.id);
      created += 1;
    }

    await this.audit.log({
      actorId,
      action: "campaign.enqueue",
      entityType: "Campaign",
      entityId: id,
      metadata: { recipients: created },
    });

    return { recipients: created };
  }

  async processCampaignRecipient(recipientId: string) {
    const recipient = await this.prisma.campaignRecipient.findUnique({
      where: { id: recipientId },
      include: { campaign: true },
    });
    if (!recipient || recipient.status === "sent") return { skipped: true };

    const channels = (recipient.campaign.channels as string[]) ?? ["email"];
    try {
      const result = await this.notifications.dispatch({
        userId: recipient.userId,
        eventCode: "campaign.broadcast",
        data: {
          subject: recipient.campaign.subject ?? recipient.campaign.name,
          body: recipient.campaign.body,
          coupon: recipient.campaign.couponCode ?? "",
        },
        forceChannels: channels,
      });
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          status: result.created > 0 ? "sent" : "skipped",
          notificationId: result.ids?.[0] ?? null,
        },
      });
    } catch (e) {
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { status: "failed" },
      });
      throw e;
    }

    const pending = await this.prisma.campaignRecipient.count({
      where: { campaignId: recipient.campaignId, status: "pending" },
    });
    if (pending === 0) {
      await this.prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { status: "completed", completedAt: new Date() },
      });
    }
    return { ok: true };
  }

  async getAbandonedCartAdmin() {
    const settings = await this.loadAbandonedSettings();
    const reminders = await this.prisma.abandonedCartReminder.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      include: { customer: { select: { id: true, name: true, userId: true } } },
    });
    return { settings, reminders };
  }

  async updateAbandonedSettings(
    input: { enabled?: boolean; delayHours?: number; maxReminders?: number },
    actorId?: string,
  ) {
    const map: Record<string, unknown> = {};
    if (input.enabled != null) map["marketing.abandonedCartEnabled"] = input.enabled;
    if (input.delayHours != null) map["marketing.abandonedCartDelayHours"] = input.delayHours;
    if (input.maxReminders != null) map["marketing.abandonedCartMaxReminders"] = input.maxReminders;
    for (const [key, value] of Object.entries(map)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue },
        update: { value: value as Prisma.InputJsonValue },
      });
    }
    await this.audit.log({
      actorId,
      action: "abandoned.settings",
      entityType: "SystemSetting",
      entityId: "marketing.abandoned",
    });
    return this.loadAbandonedSettings();
  }

  async processAbandonedCarts() {
    const settings = await this.loadAbandonedSettings();
    if (!settings.enabled) return { sent: 0 };

    const cutoff = new Date(Date.now() - settings.delayHours * 3600_000);
    const carts = await this.prisma.cart.findMany({
      where: {
        updatedAt: { lt: cutoff },
        items: { some: {} },
      },
      include: {
        customer: { include: { user: true } },
        items: true,
        abandonedReminders: true,
      },
      take: 50,
    });

    let sent = 0;
    for (const cart of carts) {
      if (cart.abandonedReminders.length >= settings.maxReminders) continue;
      const recentOrder = await this.prisma.order.findFirst({
        where: {
          customerId: cart.customerId,
          createdAt: { gte: cart.updatedAt },
        },
      });
      if (recentOrder) continue;

      const wave = cart.abandonedReminders.length + 1;
      await this.notifications.dispatch({
        userId: cart.customer.userId,
        eventCode: "cart.abandoned",
        data: { cartId: cart.id },
      });
      await this.prisma.abandonedCartReminder.create({
        data: { cartId: cart.id, customerId: cart.customerId, wave },
      });
      sent += 1;
    }
    return { sent };
  }

  listSocialPosts() {
    return this.prisma.socialPost.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createSocialPost(
    input: {
      platform: string;
      title: string;
      body: string;
      mediaUrl?: string | null;
      status?: string;
    },
    actorId?: string,
  ) {
    const row = await this.prisma.socialPost.create({
      data: {
        platform: input.platform,
        title: input.title,
        body: input.body,
        mediaUrl: input.mediaUrl ?? null,
        status: input.status ?? "draft",
        createdBy: actorId,
      },
    });
    await this.audit.log({
      actorId,
      action: "social.create",
      entityType: "SocialPost",
      entityId: row.id,
    });
    return row;
  }

  async updateSocialPost(
    id: string,
    input: Partial<{
      platform: string;
      title: string;
      body: string;
      mediaUrl: string | null;
      status: string;
    }>,
    actorId?: string,
  ) {
    const row = await this.prisma.socialPost.update({
      where: { id },
      data: {
        platform: input.platform,
        title: input.title,
        body: input.body,
        mediaUrl: input.mediaUrl === undefined ? undefined : input.mediaUrl,
        status: input.status,
      },
    });
    await this.audit.log({
      actorId,
      action: "social.update",
      entityType: "SocialPost",
      entityId: id,
    });
    return row;
  }

  async deleteSocialPost(id: string, actorId?: string) {
    await this.prisma.socialPost.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" },
    });
    await this.audit.log({
      actorId,
      action: "social.delete",
      entityType: "SocialPost",
      entityId: id,
    });
    return { deleted: true };
  }

  async analytics() {
    const weekAgo = new Date(Date.now() - 7 * 86400_000);
    const [recipientGroups, abandonedCount, segments] = await Promise.all([
      this.prisma.campaignRecipient.groupBy({
        by: ["status"],
        _count: true,
      }),
      this.prisma.abandonedCartReminder.count({ where: { sentAt: { gte: weekAgo } } }),
      this.prisma.segment.findMany({ where: { deletedAt: null, active: true }, take: 10 }),
    ]);

    const segmentSizes = [];
    for (const s of segments) {
      const members = await this.resolveSegmentMembers(s.rules as SegmentRules);
      segmentSizes.push({ id: s.id, name: s.name, count: members.length });
    }

    return {
      campaignRecipients: recipientGroups.map((g) => ({
        status: g.status,
        count: g._count,
      })),
      abandonedReminders7d: abandonedCount,
      segments: segmentSizes,
    };
  }

  private async loadAbandonedSettings() {
    const rows = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "marketing.abandonedCartEnabled",
            "marketing.abandonedCartDelayHours",
            "marketing.abandonedCartMaxReminders",
          ],
        },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      enabled: Boolean(map["marketing.abandonedCartEnabled"] ?? true),
      delayHours: Number(map["marketing.abandonedCartDelayHours"] ?? 24),
      maxReminders: Number(map["marketing.abandonedCartMaxReminders"] ?? 1),
    };
  }

  private async allCustomerUserIds() {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      select: { userId: true },
    });
    return customers.map((c) => c.userId);
  }

  private async resolveSegmentMembers(rules: SegmentRules): Promise<string[]> {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, mobile: true } },
        orders: { select: { total: true } },
      },
    });
    const matched: string[] = [];
    for (const c of customers) {
      const stats: CustomerStats = {
        userId: c.userId,
        mobile: c.user.mobile,
        orderCount: c.orders.length,
        spend: c.orders.reduce((s, o) => s + Number(o.total), 0),
      };
      if (matchesSegmentRules(stats, rules)) matched.push(c.userId);
    }
    return matched;
  }
}
