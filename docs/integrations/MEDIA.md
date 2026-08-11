# Media Storage — t360

## Initial provider

**Cloudinary** for product images: resizing, compression, WebP/AVIF, thumbnails, responsive delivery.

## Port

```ts
interface MediaStorage {
  upload(input: UploadInput): Promise<MediaAsset>
  delete(publicId: string): Promise<void>
  deliveryUrl(publicId: string, transforms?: TransformOptions): string
}
```

Future adapter: S3-compatible storage + CloudFront (or Railway bucket) without changing catalogue domain code.

## Rules

- Validate MIME types and size limits before upload  
- Store provider public id + metadata on `ProductImage`  
- Never commit cloud API secrets  
- Dev may use unsigned test presets only in non-production  

Implementation begins with catalogue image flows in Phase 4.
