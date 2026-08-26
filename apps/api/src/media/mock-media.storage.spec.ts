import { MockMediaStorage } from "./mock-media.storage";

describe("MockMediaStorage.deleteByPublicId", () => {
  it("records deleted public ids", async () => {
    const media = new MockMediaStorage();
    const result = await media.deleteByPublicId("t360/try-on/abc");
    expect(result).toEqual({ deleted: true });
    expect(media.deletedPublicIds).toEqual(["t360/try-on/abc"]);
  });

  it("no-ops on empty public id", async () => {
    const media = new MockMediaStorage();
    expect(await media.deleteByPublicId("")).toEqual({ deleted: false });
    expect(await media.deleteByPublicId("   ")).toEqual({ deleted: false });
    expect(media.deletedPublicIds).toEqual([]);
  });
});
