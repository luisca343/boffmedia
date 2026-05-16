import { Injectable, BadRequestException } from '@nestjs/common';
import {
  FileUploadService,
  FileUploadRequest,
  FileUploadResponse,
} from './file-upload.service';

export interface ImageUploadRequest extends FileUploadRequest {
  maxSizeInMB?: number;
}

@Injectable()
export class ImageUploadService {
  private readonly allowedImageTypes = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
  ];
  private readonly defaultMaxSizeInBytes = 5 * 1024 * 1024; // 5MB

  constructor(private readonly fileUploadService: FileUploadService) {}

  async uploadImage(
    imageRequest: ImageUploadRequest,
  ): Promise<FileUploadResponse> {
    const { file, maxSizeInMB, ...uploadRequest } = imageRequest;

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate image type
    const isValidType = await this.fileUploadService.validateFileType(
      file,
      this.allowedImageTypes,
    );
    if (!isValidType) {
      throw new BadRequestException(
        'Only image files (jpg, jpeg, png, gif, webp) are allowed',
      );
    }

    // Validate file size
    const maxSize = maxSizeInMB
      ? maxSizeInMB * 1024 * 1024
      : this.defaultMaxSizeInBytes;
    const isValidSize = await this.fileUploadService.validateFileSize(
      file,
      maxSize,
    );
    if (!isValidSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `Image size must be less than ${maxSizeMB}MB`,
      );
    }

    // Upload the image
    return this.fileUploadService.uploadFile({ file, ...uploadRequest });
  }

  async deleteImage(
    path: string,
    filename: string,
  ): Promise<{ success: boolean }> {
    return this.fileUploadService.deleteFile(path, filename);
  }

  async getImageInfo(
    path: string,
    filename: string,
  ): Promise<{ exists: boolean; size?: number; createdAt?: Date }> {
    return this.fileUploadService.getFileInfo(path, filename);
  }

  getSupportedImageTypes(): string[] {
    return [...this.allowedImageTypes];
  }

  getMaxImageSize(): number {
    return this.defaultMaxSizeInBytes;
  }
}
