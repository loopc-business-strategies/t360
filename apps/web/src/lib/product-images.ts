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
  const secondImageUrl =
    second && second !== imageUrl ? second : undefined;
  return { imageUrl, secondImageUrl };
}
