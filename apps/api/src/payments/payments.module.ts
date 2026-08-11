import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MockPaymentProvider } from "./mock-payment.provider";
import { PAYMENT_PROVIDER } from "./payment-provider";
import { RazorpayPaymentProvider } from "./razorpay-payment.provider";

@Global()
@Module({
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mode = (config.get<string>("PAYMENT_PROVIDER") ?? "mock").toLowerCase();
        if (mode === "razorpay") {
          return new RazorpayPaymentProvider(
            config.getOrThrow("RAZORPAY_KEY_ID"),
            config.getOrThrow("RAZORPAY_KEY_SECRET"),
            config.get<string>("RAZORPAY_WEBHOOK_SECRET") ?? "",
          );
        }
        return new MockPaymentProvider();
      },
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
