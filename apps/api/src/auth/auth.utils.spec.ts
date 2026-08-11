import { assertRateLimitCount, hashToken } from "./auth.utils";

describe("auth.utils", () => {
  it("hashes tokens deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abcd"));
  });

  it("enforces rate limit threshold", () => {
    expect(assertRateLimitCount(5, 5)).toBe(true);
    expect(assertRateLimitCount(6, 5)).toBe(false);
  });
});
