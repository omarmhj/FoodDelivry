import { Injectable, Logger } from "@nestjs/common";
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from "cloudinary";

type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async upload(data: string, folder: string = "restaurants"): Promise<CloudinaryResponse> {
    try {
      this.logger.log(`🍕 RESTAURANT SERVICE | ☁️ Uploading image to Cloudinary folder: ${folder}`);
      
      const result = await cloudinary.uploader.upload(data, {
        folder: `snackrapido/${folder}`,
        resource_type: "auto",
        quality: "auto",
        fetch_format: "auto",
      });

      this.logger.log(`🍕 RESTAURANT SERVICE | ✅ Image uploaded successfully: ${result.public_id}`);
      return result;
    } catch (error) {
      this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to upload image:`, error);
      throw error;
    }
  }

  async uploadMultiple(images: string[], folder: string = "restaurants"): Promise<CloudinaryResponse[]> {
    try {
      this.logger.log(`🍕 RESTAURANT SERVICE | ☁️ Uploading ${images.length} images to Cloudinary`);
      
      const uploadPromises = images.map(image => this.upload(image, folder));
      const results = await Promise.all(uploadPromises);

      this.logger.log(`🍕 RESTAURANT SERVICE | ✅ All ${images.length} images uploaded successfully`);
      return results;
    } catch (error) {
      this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to upload multiple images:`, error);
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      this.logger.log(`🍕 RESTAURANT SERVICE | 🗑️ Deleting image: ${publicId}`);
      
      await cloudinary.uploader.destroy(publicId);
      
      this.logger.log(`🍕 RESTAURANT SERVICE | ✅ Image deleted successfully: ${publicId}`);
    } catch (error) {
      this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to delete image ${publicId}:`, error);
      throw error;
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      this.logger.log(`🍕 RESTAURANT SERVICE | 🗑️ Deleting ${publicIds.length} images`);
      
      const deletePromises = publicIds.map(publicId => this.deleteImage(publicId));
      await Promise.all(deletePromises);

      this.logger.log(`🍕 RESTAURANT SERVICE | ✅ All ${publicIds.length} images deleted successfully`);
    } catch (error) {
      this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to delete multiple images:`, error);
      throw error;
    }
  }
}
