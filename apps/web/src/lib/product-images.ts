export type ProductCardImage = {
  url: string;
  mediaType?: string;
  publicId?: string | null;
  sortOrder?: number;
};

/** Primary + optional hover still for product grid cards. */
export function selectProductCardImages(images?: ProductCardImage[]) {
  const stills = (images ?? []).filter((i) => i.mediaType !== "video");
  const imageUrl = stills[0]?.url;
  const second = stills[1]?.url;
  const isDemoGallery =
    stills[0]?.publicId?.startsWith("demo/") && stills.length > 1;
  const secondImageUrl =
    second && second !== imageUrl && !isDemoGallery ? second : undefined;
  return { imageUrl, secondImageUrl };
}
