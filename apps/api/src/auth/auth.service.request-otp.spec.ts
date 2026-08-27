import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { SmsProvider } from "../notifications/providers/sms-provider";

describe("AuthService.requestOtp", () => {
  function build(opts: {
    providerName: string;
    allowDevOtp?: string;
  }) {
    const redis = {
      client: {
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn(),
        set: jest.fn(),
      },
    };
    const sms: SmsProvider = {
      providerName: opts.providerName,
      sendOtp: jest.fn().mockResolvedValue(undefined),
      send: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "ALLOW_DEV_OTP") return opts.allowDevOtp;
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new AuthService(
      {} as never,
      redis as never,
      {} as never,
      config,
      {} as never,
      {} as never,
      sms,
      { send: jest.fn() } as never,
    );
    return { service, sms, redis };
  }

  it("includes devOtp when ALLOW_DEV_OTP and mock SMS", async () => {
    const { service, sms } = build({ providerName: "mock", allowDevOtp: "1" });
    const result = await service.requestOtp("+919876543210");
    expect(result.sent).toBe(true);
    expect(result.provider).toBe("mock");
    expect(result).toHaveProperty("devOtp");
    expect((result as { devOtp: string }).devOtp).toMatch(/^\d{6}$/);
    expect(sms.sendOtp).toHaveBeenCalled();
  });

  it("withholds devOtp when ALLOW_DEV_OTP is off", async () => {
    const { service } = build({ providerName: "mock" });
    const result = await service.requestOtp("+919876543210");
    expect(result.provider).toBe("mock");
    expect(result).not.toHaveProperty("devOtp");
  });

  it("withholds devOtp for msg91 even when ALLOW_DEV_OTP is on", async () => {
    const { service } = build({ providerName: "msg91", allowDevOtp: "1" });
    const result = await service.requestOtp("+919876543210");
    expect(result.provider).toBe("msg91");
    expect(result).not.toHaveProperty("devOtp");
  });
});
