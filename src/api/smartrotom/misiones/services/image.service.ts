import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface ImageUploadRequest {
  npcName: string;
  image: string; // Base64 encoded image
}

export interface ImageUploadResponse {
  status: string;
  path?: string;
  error?: string;
}

export interface ImageExistsResponse {
  exists: boolean;
  path?: string;
}

@Injectable()
export class ImageService {
  private readonly BASE_PATH = './public/smartrotom/img/customNPC';
  private readonly RENDER_PATH = join(this.BASE_PATH, 'renders');

  constructor() {
    this.ensureDirectoriesExist();
  }

  async uploadCustomNPCImage(request: ImageUploadRequest): Promise<ImageUploadResponse> {
    try {
      const { npcName, image } = request;
      
      if (!npcName || !image) {
        throw new Error('NPC name and image are required');
      }

      if (!this.isValidNPCName(npcName)) {
        throw new Error('Invalid NPC name format');
      }

      if (!this.isValidBase64Image(image)) {
        throw new Error('Invalid image format. Expected base64 PNG.');
      }

      const cleanedImage = image.replace(/^data:image\/png;base64,/, '');
      const filePath = join(this.RENDER_PATH, `${npcName}.png`);

      await fs.writeFile(filePath, cleanedImage, 'base64');

      return {
        status: 'OK',
        path: filePath
      };
    } catch (error) {
      console.error(`Failed to upload image for NPC ${request.npcName}:`, error);
      return {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  async checkCustomNPCRenderExists(npcName: string): Promise<ImageExistsResponse> {
    try {
      if (!this.isValidNPCName(npcName)) {
        return { exists: false };
      }

      const filePath = join(this.RENDER_PATH, `${npcName}.png`);
      
      try {
        await fs.access(filePath);
        return { exists: true, path: filePath };
      } catch {
        return { exists: false };
      }
    } catch (error) {
      console.error(`Failed to check render existence for NPC ${npcName}:`, error);
      return { exists: false };
    }
  }

  async checkCustomNPCImageExists(npcName: string): Promise<ImageExistsResponse> {
    try {
      if (!this.isValidNPCName(npcName)) {
        return { exists: false };
      }

      const filePath = join(this.BASE_PATH, `${npcName}.png`);
      
      try {
        await fs.access(filePath);
        return { exists: true, path: filePath };
      } catch {
        return { exists: false };
      }
    } catch (error) {
      console.error(`Failed to check image existence for NPC ${npcName}:`, error);
      return { exists: false };
    }
  }

  async deleteCustomNPCImage(npcName: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isValidNPCName(npcName)) {
        throw new Error('Invalid NPC name format');
      }

      const imagePath = join(this.BASE_PATH, `${npcName}.png`);
      const renderPath = join(this.RENDER_PATH, `${npcName}.png`);

      // Delete both files if they exist
      const deletePromises = [imagePath, renderPath].map(async (path) => {
        try {
          await fs.unlink(path);
        } catch (error) {
          // File might not exist, which is fine
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      });

      await Promise.all(deletePromises);

      return { success: true };
    } catch (error) {
      console.error(`Failed to delete images for NPC ${npcName}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.mkdir(this.BASE_PATH, { recursive: true });
      await fs.mkdir(this.RENDER_PATH, { recursive: true });
    } catch (error) {
      console.error('Failed to create image directories:', error);
    }
  }

  private isValidNPCName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    
    // Allow alphanumeric characters, underscores, and hyphens
    const validNameRegex = /^[a-zA-Z0-9_-]+$/;
    return validNameRegex.test(name) && name.length <= 50;
  }

  private isValidBase64Image(image: string): boolean {
    if (!image || typeof image !== 'string') return false;
    
    // Check if it's a PNG base64 image
    const base64PngRegex = /^data:image\/png;base64,/;
    return base64PngRegex.test(image);
  }
}