import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_INSTAGRAM_URL,
  DEFAULT_WHATSAPP_E164,
  getInstagramUrl,
  getWhatsAppE164,
} from "./social";

describe("social helpers", () => {
  const prevWa = process.env.NEXT_PUBLIC_WHATSAPP_E164;
  const prevIg = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  afterEach(() => {
    if (prevWa === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_E164;
    else process.env.NEXT_PUBLIC_WHATSAPP_E164 = prevWa;
    if (prevIg === undefined) delete process.env.NEXT_PUBLIC_INSTAGRAM_URL;
    else process.env.NEXT_PUBLIC_INSTAGRAM_URL = prevIg;
  });

  it("falls back from placeholder WhatsApp to default", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_E164 = "919876543210";
    assert.equal(getWhatsAppE164(), DEFAULT_WHATSAPP_E164);
  });

  it("uses configured WhatsApp digits", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_E164 = "+91 90000 11111";
    assert.equal(getWhatsAppE164(), "919000011111");
  });

  it("falls back Instagram when unset", () => {
    delete process.env.NEXT_PUBLIC_INSTAGRAM_URL;
    assert.equal(getInstagramUrl(), DEFAULT_INSTAGRAM_URL);
  });
});
