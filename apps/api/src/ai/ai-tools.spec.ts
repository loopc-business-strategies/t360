import { ForbiddenException } from "@nestjs/common";
import { AiToolsService } from "./ai-tools.service";
import { MockAiProvider } from "./providers/mock-ai.provider";

describe("AiToolsService authz", () => {
  it("denies customer calling admin tools", async () => {
    const svc = new AiToolsService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await expect(
      svc.execute("salesSummary", {}, { userId: "u1", audience: "customer" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("getOrderStatus uses customer-scoped order lookup", async () => {
    const orders = {
      getByIdForCustomer: jest.fn().mockResolvedValue({
        id: "o1",
        status: "Confirmed",
        total: 100,
        createdAt: new Date(),
      }),
      listForCustomer: jest.fn(),
    };
    const svc = new AiToolsService(
      {} as never,
      {} as never,
      orders as never,
      {} as never,
      {} as never,
    );
    const result = await svc.execute(
      "getOrderStatus",
      { orderId: "o1" },
      { userId: "u1", audience: "customer" },
    );
    expect(orders.getByIdForCustomer).toHaveBeenCalledWith("u1", "o1");
    expect(result).toMatchObject({ id: "o1", status: "Confirmed" });
  });
});

describe("MockAiProvider", () => {
  it("does not invent SKUs when tool results are empty", async () => {
    const provider = new MockAiProvider();
    const result = await provider.chat({
      audience: "customer",
      tools: [{ name: "searchProducts", description: "", parameters: {} }],
      messages: [
        { role: "user", content: "shirts under 1500" },
        { role: "tool", content: JSON.stringify({ items: [] }), toolName: "searchProducts" },
      ],
    });
    expect(result.content).toMatch(/will not invent|No products matched|could not find/i);
    expect(result.content).not.toMatch(/SKU-FAKE|₹9999/);
  });

  it("requests searchProducts for product queries", async () => {
    const provider = new MockAiProvider();
    const result = await provider.chat({
      audience: "customer",
      tools: [{ name: "searchProducts", description: "", parameters: {} }],
      messages: [{ role: "user", content: "men shirts under 1500" }],
    });
    expect(result.toolCalls?.[0]?.name).toBe("searchProducts");
    expect(result.toolCalls?.[0]?.arguments).toMatchObject({ maxPrice: 1500 });
  });
});
