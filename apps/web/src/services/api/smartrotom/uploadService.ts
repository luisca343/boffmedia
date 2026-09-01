import { apiUpload } from "@/services/boffAPI";
import { type ApiResponse } from "@/services/boffAPI";

interface UploadResponse {
  filename: string;
  path: string;
  url: string;
}

/**
 * Uploads subdirectories used by the admin content forms. A closed union rather
 * than a free string: `path` reaches multer's `destination`, and keeping the set
 * enumerated here is what stops a caller from inventing a new folder per form.
 */
export type UploadFolder = "events" | "games" | "teams" | "tournaments"

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

  /**
   * Upload an image for an admin-managed content record (event, game, team…).
   *
   * The filename is generated rather than taken from the picked file: two admins
   * uploading their own `banner.jpg` would otherwise overwrite each other, since
   * the API writes to `uploads/<path>/<filename>` with no collision check.
   */
  static uploadContentImage(file: File, folder: UploadFolder) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const rand = Math.random().toString(36).slice(2, 8)
    return apiUpload(file, {
      path: folder,
      filename: `${folder}-${Date.now()}-${rand}.${ext}`,
    })
  }

  /**
   * Upload a cover (banner) image for a user
   */
  static uploadCoverImage(file: File, userId: string) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    return apiUpload(file, {
      path: `profiles/covers`,
      filename: `${userId}-cover-${Date.now()}.${ext}`
    });
  }
}