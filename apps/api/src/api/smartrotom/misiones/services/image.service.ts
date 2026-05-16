import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

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
  private readonly logger = new Logger(ImageService.name);
  private readonly baseImagePath = './public/smartrotom/img/customNPC';
  private readonly renderPath = path.join(this.baseImagePath, 'renders');
  private readonly imagePath = path.join(this.baseImagePath, 'images');

  constructor() {
    this.ensureDirectoriesExist();
  }

  async uploadCustomNPCImage(
    request: ImageUploadRequest,
  ): Promise<ImageUploadResponse> {
    try {
      if (!request.npcName || !request.image) {
        throw new BadRequestException('NPC name and image are required');
      }

      // Validate image format
      if (!request.image.startsWith('data:image/png;base64,')) {
        throw new BadRequestException('Image must be a base64 encoded PNG');
      }

      // Extract base64 data
      const base64Data = request.image.replace(/^data:image\/png;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Sanitize filename
      const sanitizedName = this.sanitizeFilename(request.npcName);
      const filename = `${sanitizedName}.png`;
      const filepath = path.join(this.renderPath, filename);

      // Write file
      await fs.writeFile(filepath, imageBuffer);

      this.logger.log(
        `Successfully uploaded image for NPC: ${request.npcName}`,
      );

      return {
        status: 'OK',
        path: filepath,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to upload image for NPC ${request.npcName}`,
        error.stack,
      );

      return {
        status: 'ERROR',
        error: error.message || 'Upload failed',
      };
    }
  }

  async checkCustomNPCRenderExists(
    npcName: string,
  ): Promise<ImageExistsResponse> {
    const sanitizedName = this.sanitizeFilename(npcName);
    const filepath = path.join(this.renderPath, `${sanitizedName}.png`);

    try {
      await fs.access(filepath);
      return {
        exists: true,
        path: filepath,
      };
    } catch {
      return {
        exists: false,
      };
    }
  }

  async checkCustomNPCImageExists(
    npcName: string,
  ): Promise<ImageExistsResponse> {
    const sanitizedName = this.sanitizeFilename(npcName);
    const filepath = path.join(this.imagePath, `${sanitizedName}.png`);

    try {
      await fs.access(filepath);
      return {
        exists: true,
        path: filepath,
      };
    } catch {
      return {
        exists: false,
      };
    }
  }

  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.mkdir(this.renderPath, { recursive: true });
      await fs.mkdir(this.imagePath, { recursive: true });
      this.logger.log('Image directories ensured');
    } catch (error: any) {
      this.logger.error('Failed to create image directories', error.stack);
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }
}
