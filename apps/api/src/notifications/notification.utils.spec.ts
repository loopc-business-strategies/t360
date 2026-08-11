import {
  channelAllowedByPrefs,
  isTransactionalEvent,
  renderTemplate,
  statusToEventCode,
} from "./notification.utils";

describe("notification.utils", () => {
  it("renders template placeholders", () => {
    expect(renderTemplate("Order {{number}} ₹{{total}}", { number: "TR1", total: 100 })).toBe(
      "Order TR1 ₹100",
    );
  });

  it("maps order statuses to events", () => {
    expect(statusToEventCode("Confirmed")).toBe("order.confirmed");
    expect(statusToEventCode("Packed")).toBe("order.shipped");
    expect(statusToEventCode("OutForDelivery")).toBe("order.shipped");
    expect(statusToEventCode("Delivered")).toBe("order.delivered");
    expect(statusToEventCode("Cancelled")).toBe("order.cancelled");
    expect(statusToEventCode("Processing")).toBeNull();
  });

  it("treats order events as transactional", () => {
    expect(isTransactionalEvent("order.confirmed")).toBe(true);
    expect(isTransactionalEvent("promo.sale")).toBe(false);
  });

  it("allows transactional channels even when marketing off", () => {
    const prefs = {
      marketingEmail: false,
      marketingSms: false,
      marketingPush: false,
      marketingWhatsapp: false,
    };
    expect(channelAllowedByPrefs("email", true, prefs)).toBe(true);
    expect(channelAllowedByPrefs("email", false, prefs)).toBe(false);
    expect(channelAllowedByPrefs("sms", false, { ...prefs, marketingSms: true })).toBe(true);
  });
});
