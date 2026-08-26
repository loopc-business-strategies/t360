import { Global, Module } from "@nestjs/common";
import { MEDIA_STORAGE } from "./media-storage";
import { MockMediaStorage } from "./mock-media.storage";
import { CloudinaryMediaStorage } from "./cloudinary-media.storage";
import { MediaAdminController } from "./media-admin.controller";

@Global()
@Module({
  controllers: [MediaAdminController],
  providers: [
    MockMediaStorage,
    CloudinaryMediaStorage,
    {
      provide: MEDIA_STORAGE,
      useFactory: (mock: MockMediaStorage, cloud: CloudinaryMediaStorage) => {
        if (
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ) {
          return cloud;
        }
        const allowMock =
          process.env.ALLOW_MOCK_PROVIDERS === "1" ||
          process.env.ALLOW_MOCK_PROVIDERS === "true" ||
          process.env.NODE_ENV !== "production";
        if (!allowMock) {
          throw new Error(
            "Cloudinary is required in production. Set CLOUDINARY_* or ALLOW_MOCK_PROVIDERS=1.",
          );
        }
        return mock;
      },
      inject: [MockMediaStorage, CloudinaryMediaStorage],
    },
  ],
  exports: [MEDIA_STORAGE],
})
export class MediaModule {}
