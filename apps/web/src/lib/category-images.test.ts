import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCategoryImageUrl,
  getCategorySegment,
  SEGMENT_NEUTRAL_IMAGES,
} from "./category-images";

describe("getCategorySegment", () => {
  it("maps slug prefixes to correct segments", () => {
    assert.equal(getCategorySegment("sarees-silk"), "sarees");
    assert.equal(getCategorySegment("women-kurtis"), "women");
    assert.equal(getCategorySegment("men-t-shirts"), "men");
    assert.equal(getCategorySegment("kids-dresses"), "kids");
    assert.equal(getCategorySegment("wedding-lehengas"), "wedding");
  });
});

describe("getCategoryImageUrl", () => {
  it("returns curated map for known slugs", () => {
    const saree = getCategoryImageUrl("sarees-silk");
    const shirt = getCategoryImageUrl("men-casual-shirts");
    assert.notEqual(saree, shirt);
  });

  it("uses sibling fallback for unmapped related slugs", () => {
    assert.equal(
      getCategoryImageUrl("sarees-cotton"),
      getCategoryImageUrl("sarees-silk"),
    );
  });

  it("never assigns men's image to saree slugs", () => {
    const menNeutral = SEGMENT_NEUTRAL_IMAGES.men;
    const unknownSaree = getCategoryImageUrl("sarees-designer-unknown");
    assert.notEqual(unknownSaree, menNeutral);
    assert.equal(unknownSaree, SEGMENT_NEUTRAL_IMAGES.sarees);
  });

  it("never assigns women's image to men's slugs", () => {
    const unknownMen = getCategoryImageUrl("men-unknown-category");
    assert.equal(unknownMen, SEGMENT_NEUTRAL_IMAGES.men);
    assert.notEqual(unknownMen, SEGMENT_NEUTRAL_IMAGES.women);
  });

  it("never assigns saree image to kids slugs", () => {
    const unknownKids = getCategoryImageUrl("kids-unknown");
    assert.equal(unknownKids, SEGMENT_NEUTRAL_IMAGES.kids);
    assert.notEqual(unknownKids, SEGMENT_NEUTRAL_IMAGES.sarees);
  });
});
