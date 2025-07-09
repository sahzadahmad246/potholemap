import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImageStream(file: Buffer, folder: string): Promise<{ publicId: string; url: string }> {
  try {
    const stream = Readable.from(file);
    const uploadResult = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve({ public_id: result.public_id, secure_url: result.secure_url });
        }
      );
      stream.pipe(uploadStream);
    });
    return { publicId: uploadResult.public_id, url: uploadResult.secure_url };
  } catch (error) {
    throw new Error(`Failed to upload image to Cloudinary: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    throw new Error(`Failed to delete image from Cloudinary: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}