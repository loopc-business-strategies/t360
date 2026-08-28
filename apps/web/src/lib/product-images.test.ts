import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectProductCardImages } from "./product-images";

describe("selectProductCardImages", () => {
  it("disables hover swap for demo multi-image galleries", () => {
    const result = selectProductCardImages([
      { url: "https://cdn.example/a.jpg", publicId: "demo/batch/slug/0" },
      { url: "https://cdn.example/b.jpg", publicId: "demo/batch/slug/1" },
    ]);
    assert.equal(result.imageUrl, "https://cdn.example/a.jpg");
    assert.equal(result.secondImageUrl, undefined);
  });

  it("enables hover swap for merchant products with a second still", () => {
    const result = selectProductCardImages([
      { url: "https://cdn.example/a.jpg", publicId: "shop/a" },
      { url: "https://cdn.example/b.jpg", publicId: "shop/b" },
    ]);
    assert.equal(result.secondImageUrl, "https://cdn.example/b.jpg");
  });

  it("skips video entries when picking hover still", () => {
    const result = selectProductCardImages([
      { url: "https://cdn.example/a.jpg", mediaType: "image" },
      { url: "https://cdn.example/v.mp4", mediaType: "video" },
      { url: "https://cdn.example/c.jpg", mediaType: "image" },
    ]);
    assert.equal(result.secondImageUrl, "https://cdn.example/c.jpg");
  });
});
