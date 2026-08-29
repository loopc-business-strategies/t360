import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCategoryImageUrl,
  getCategorySegment,
  SEGMENT_NEUTRAL_IMAGES,
} from "./category-images";

describe("getCategorySegment", () => {
  it("maps slug prefixes to correct segments", () => {
    assert.equal(getCategorySegment("women-kurtis"), "women");
    assert.equal(getCategorySegment("men-t-shirts"), "men");
    assert.equal(getCategorySegment("kids-dresses"), "kids");
    assert.equal(getCategorySegment("wedding-lehengas"), "wedding");
    assert.equal(getCategorySegment("festival-kurtas"), "festival");
  });
});

describe("getCategoryImageUrl", () => {
  it("returns curated map for known slugs", () => {
    const kurtis = getCategoryImageUrl("women-kurtis");
    const shirt = getCategoryImageUrl("men-casual-shirts");
    assert.notEqual(kurtis, shirt);
  });

  it("uses sibling fallback for unmapped related slugs", () => {
    assert.equal(
      getCategoryImageUrl("men-chinos"),
      getCategoryImageUrl("men-jeans"),
    );
  });

  it("never assigns men's image to wedding slugs", () => {
    const menNeutral = SEGMENT_NEUTRAL_IMAGES.men;
    const unknownWedding = getCategoryImageUrl("wedding-unknown-style");
    assert.notEqual(unknownWedding, menNeutral);
    assert.equal(unknownWedding, SEGMENT_NEUTRAL_IMAGES.wedding);
  });

  it("never assigns women's image to men's slugs", () => {
    const unknownMen = getCategoryImageUrl("men-unknown-category");
    assert.equal(unknownMen, SEGMENT_NEUTRAL_IMAGES.men);
    assert.notEqual(unknownMen, SEGMENT_NEUTRAL_IMAGES.women);
  });

  it("never assigns wedding image to kids slugs", () => {
    const unknownKids = getCategoryImageUrl("kids-unknown");
    assert.equal(unknownKids, SEGMENT_NEUTRAL_IMAGES.kids);
    assert.notEqual(unknownKids, SEGMENT_NEUTRAL_IMAGES.wedding);
  });
});
