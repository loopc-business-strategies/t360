import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EMAIL_PROVIDER, EmailProvider } from "./providers/email-provider";
import { PUSH_PROVIDER, PushProvider } from "./providers/push-provider";
import { SMS_PROVIDER, SmsProvider } from "./providers/sms-provider";
import { WHATSAPP_PROVIDER, WhatsappProvider } from "./providers/whatsapp-provider";
import { NotificationsQueueService } from "./notifications-queue.service";
import {
  channelAllowedByPrefs,
  eventToTemplateCode,
  isTransactionalEvent,
  renderTemplate,
} from "./notification.utils";

const CHANNELS = ["email", "sms", "push", "whatsapp"] as const;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly queue: NotificationsQueueService,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
    @Inject(PUSH_PROVIDER) private readonly push: PushProvider,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsappProvider,
  ) {}

  async ensurePrefs(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getPrefs(userId: string) {
    return this.ensurePrefs(userId);
  }

  async updatePrefs(
    userId: string,
    body: {
      marketingEmail?: boolean;
      marketingSms?: boolean;
      marketingPush?: boolean;
      marketingWhatsapp?: boolean;
    },
    actorId?: string,
  ) {
    await this.ensurePrefs(userId);
    const row = await this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        marketingEmail: body.marketingEmail,
        marketingSms: body.marketingSms,
        marketingPush: body.marketingPush,
        marketingWhatsapp: body.marketingWhatsapp,
      },
    });
    await this.audit.log({
      actorId: actorId ?? userId,
      action: "notification.prefs.update",
      entityType: "NotificationPreference",
      entityId: row.id,
    });
    return row;
  }

  async listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async registerDevice(userId: string, token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform, lastSeenAt: new Date() },
      update: { userId, platform, lastSeenAt: new Date() },
    });
  }

  async unregisterDevice(userId: string, token: string) {
    const row = await this.prisma.deviceToken.findUnique({ where: { token } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException({ code: "DEVICE_NOT_FOUND", message: "Device not found" });
    }
    await this.prisma.deviceToken.delete({ where: { token } });
    return { deleted: true };
  }

  listTemplates() {
    return this.prisma.notificationTemplate.findMany({
      where: { active: true },
      orderBy: [{ code: "asc" }, { channel: "asc" }, { locale: "asc" }],
    });
  }

  listAdminNotifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async dispatch(input: {
    userId: string;
    eventCode: string;
    data: Record<string, string | number | undefined>;
    forceChannels?: string[];
    locale?: string;
  }) {
    const templateCode = eventToTemplateCode(input.eventCode);
    const transactional = isTransactionalEvent(input.eventCode);
    const prefs = await this.ensurePrefs(input.userId);
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) return { created: 0, ids: [] as string[] };

    const locale = input.locale ?? "en";
    const channels = input.forceChannels?.length ? input.forceChannels : [...CHANNELS];
    const createdIds: string[] = [];

    for (const channel of channels) {
      if (!channelAllowedByPrefs(channel, transactional, prefs)) continue;

      const template =
        (await this.prisma.notificationTemplate.findUnique({
          where: { code_channel_locale: { code: templateCode, channel, locale } },
        })) ??
        (await this.prisma.notificationTemplate.findUnique({
          where: { code_channel_locale: { code: templateCode, channel, locale: "en" } },
        }));
      if (!template?.active) continue;

      const to = await this.resolveRecipient(channel, user.id, user.email, user.mobile);
      if (!to) continue;

      const body = renderTemplate(template.body, input.data);
      const subject = template.subject
        ? renderTemplate(template.subject, input.data)
        : undefined;

      const row = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          channel,
          templateCode,
          to,
          status: "queued",
          payload: { subject, body, data: input.data, eventCode: input.eventCode },
        },
      });
      createdIds.push(row.id);
      await this.queue.enqueueSend(row.id);
    }

    return { created: createdIds.length, ids: createdIds };
  }

  async processSend(notificationId: string) {
    const row = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!row || row.status === "sent") return { skipped: true };

    const payload = (row.payload ?? {}) as {
      subject?: string;
      body?: string;
      data?: Record<string, string>;
    };

    try {
      let messageId: string | undefined;
      if (row.channel === "email") {
        const res = await this.email.send({
          to: row.to,
          subject: payload.subject ?? row.templateCode,
          text: payload.body ?? "",
        });
        messageId = res.messageId;
      } else if (row.channel === "sms") {
        const res = await this.sms.send(row.to, payload.body ?? "");
        messageId = res.messageId;
      } else if (row.channel === "push") {
        const tokens = await this.prisma.deviceToken.findMany({
          where: { userId: row.userId },
        });
        if (!tokens.length) {
          await this.prisma.notification.update({
            where: { id: row.id },
            data: { status: "failed", error: "No device tokens" },
          });
          return { failed: true };
        }
        const res = await this.push.send({
          tokens: tokens.map((t) => t.token),
          title: payload.subject ?? row.templateCode,
          body: payload.body ?? "",
        });
        messageId = res.messageId;
      } else if (row.channel === "whatsapp") {
        const res = await this.whatsapp.sendTemplate({
          to: row.to,
          templateName: row.templateCode.replace(/\./g, "_"),
          params: Object.values(payload.data ?? {}).map(String),
          body: payload.body,
        });
        messageId = res.messageId;
      } else {
        throw new Error(`Unknown channel ${row.channel}`);
      }

      await this.prisma.notification.update({
        where: { id: row.id },
        data: {
          status: "sent",
          providerMessageId: messageId,
          sentAt: new Date(),
          error: null,
        },
      });
      return { sent: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "send failed";
      this.logger.error(`Notification ${row.id} failed: ${message}`);
      await this.prisma.notification.update({
        where: { id: row.id },
        data: { status: "failed", error: message },
      });
      throw e;
    }
  }

  private async resolveRecipient(
    channel: string,
    userId: string,
    email: string | null | undefined,
    mobile: string | null | undefined,
  ): Promise<string | null> {
    if (channel === "email") return email ?? null;
    if (channel === "sms" || channel === "whatsapp") return mobile ?? null;
    if (channel === "push") {
      const any = await this.prisma.deviceToken.findFirst({ where: { userId } });
      return any ? "devices" : null;
    }
    return null;
  }
}
