import { apiUpload } from "@/services/boffAPI";
import { type ApiResponse } from "@/services/boffAPI";

interface UploadResponse {
  filename: string;
  path: string;
  url: string;
}

export class UploadService {
  /**
   * Upload an image file
   */
  static uploadImage(
    file: File, 
    options?: { path?: string; filename?: string }
  ) {
    return apiUpload(file, options);
  }

  /**
   * Upload a blog image
   */
  static uploadBlogImage(file: File, filename?: string) {
    return apiUpload(file, { path: 'blog/images', filename });
  }

  /**
   * Upload a profile image for a user
   */
  static uploadProfileImage(file: File, userId: string) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    return apiUpload(file, {
      path: `profiles`,
      filename: `${userId}-${Date.now()}.${ext}`
    });
  }
}