import { Global, Module } from "@nestjs/common";
import { MEDIA_STORAGE } from "./media-storage";
import { MockMediaStorage } from "./mock-media.storage";
import { CloudinaryMediaStorage } from "./cloudinary-media.storage";

@Global()
@Module({
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
        return mock;
      },
      inject: [MockMediaStorage, CloudinaryMediaStorage],
    },
  ],
  exports: [MEDIA_STORAGE],
})
export class MediaModule {}
