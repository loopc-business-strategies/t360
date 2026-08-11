export function buildWhatsAppEnquiryUrl(input: {
  e164: string;
  productName: string;
  sku: string;
  price: string | number;
  url: string;
}) {
  const digits = input.e164.replace(/\D/g, "");
  const text = [
    `Hi Tharagai, I'm interested in:`,
    input.productName,
    `SKU: ${input.sku}`,
    `Price: ₹${input.price}`,
    input.url,
  ].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
