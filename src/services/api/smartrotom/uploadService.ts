import { apiUpload } from "@/services/boffAPI";
import { type ApiResponse } from "@/services/boffAPI";

interface UploadResponse {
  filename: string;
  path: string;
  url: string;
}

export const uploadService = {
  uploadImage: (
    file: File, 
    options?: { path?: string; filename?: string }
  ) => apiUpload(file, options),

  uploadBlogImage: (file: File, filename?: string) => 
    apiUpload(file, { path: 'blog/images', filename }),

  uploadProfileImage: (file: File, userId: string) =>
    apiUpload(file, { 
      path: `profiles`,
      filename: `${userId}.jpg`
    }),

}