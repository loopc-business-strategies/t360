import { Global, Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { NotificationsAdminController } from "./notifications-admin.controller";
import { NotificationsMeController } from "./notifications-me.controller";
import { NotificationsQueueService } from "./notifications-queue.service";
import { NotificationsService } from "./notifications.service";
import { CloudWhatsappProvider } from "./providers/cloud-whatsapp.provider";
import { EMAIL_PROVIDER } from "./providers/email-provider";
import { FcmPushProvider } from "./providers/fcm-push.provider";
import { MockEmailProvider } from "./providers/mock-email.provider";
import { MockPushProvider } from "./providers/mock-push.provider";
import { MockSmsProvider } from "./providers/mock-sms.provider";
import { MockWhatsappProvider } from "./providers/mock-whatsapp.provider";
import { PUSH_PROVIDER } from "./providers/push-provider";
import { ResendEmailProvider } from "./providers/resend-email.provider";
import { SMS_PROVIDER } from "./providers/sms-provider";
import { WHATSAPP_PROVIDER } from "./providers/whatsapp-provider";
import { WhatsappWebhookController } from "./whatsapp-webhook.controller";

function forceMock() {
  return (process.env.NOTIFICATION_PROVIDER ?? "mock").toLowerCase() === "mock";
}

@Global()
@Module({
  imports: [AuditModule],
  controllers: [
    NotificationsMeController,
    NotificationsAdminController,
    WhatsappWebhookController,
  ],
  providers: [
    NotificationsService,
    NotificationsQueueService,
    MockEmailProvider,
    ResendEmailProvider,
    MockPushProvider,
    FcmPushProvider,
    MockSmsProvider,
    MockWhatsappProvider,
    CloudWhatsappProvider,
    {
      provide: EMAIL_PROVIDER,
      useFactory: (mock: MockEmailProvider, resend: ResendEmailProvider) => {
        if (forceMock() || (process.env.EMAIL_PROVIDER ?? "mock") !== "resend") return mock;
        return resend;
      },
      inject: [MockEmailProvider, ResendEmailProvider],
    },
    {
      provide: PUSH_PROVIDER,
      useFactory: (mock: MockPushProvider, fcm: FcmPushProvider) => {
        if (forceMock() || (process.env.PUSH_PROVIDER ?? "mock") !== "fcm") return mock;
        return fcm;
      },
      inject: [MockPushProvider, FcmPushProvider],
    },
    {
      provide: SMS_PROVIDER,
      useExisting: MockSmsProvider,
    },
    {
      provide: WHATSAPP_PROVIDER,
      useFactory: (mock: MockWhatsappProvider, cloud: CloudWhatsappProvider) => {
        if (forceMock() || (process.env.WHATSAPP_PROVIDER ?? "mock") !== "cloud") return mock;
        return cloud;
      },
      inject: [MockWhatsappProvider, CloudWhatsappProvider],
    },
  ],
  exports: [
    NotificationsService,
    NotificationsQueueService,
    SMS_PROVIDER,
    EMAIL_PROVIDER,
    PUSH_PROVIDER,
    WHATSAPP_PROVIDER,
  ],
})
export class NotificationsModule {}
