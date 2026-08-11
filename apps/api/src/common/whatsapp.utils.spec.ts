import { buildWhatsAppEnquiryUrl } from "./whatsapp.utils";

describe("buildWhatsAppEnquiryUrl", () => {
  it("builds wa.me link with product context", () => {
    const url = buildWhatsAppEnquiryUrl({
      e164: "+91 98765 43210",
      productName: "Blue Shirt",
      sku: "SHIRT-BL-M",
      price: 1299,
      url: "https://tharagai.local/products/blue-shirt",
    });
    expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("SKU: SHIRT-BL-M");
    expect(decodeURIComponent(url)).toContain("Blue Shirt");
  });
});
