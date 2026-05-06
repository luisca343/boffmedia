import { Injectable } from '@nestjs/common';
import { FileUploadService, FileUploadRequest, FileUploadResponse } from './services/file-upload.service';
import { ImageUploadService, ImageUploadRequest } from './services/image-upload.service';

@Injectable()
export class UploadFacadeService {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  // ==================== IMAGE UPLOAD MANAGEMENT ====================

  async uploadImage(imageRequest: ImageUploadRequest): Promise<FileUploadResponse> {
    try {
      return await this.imageUploadService.uploadImage(imageRequest);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(path: string, filename: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.imageUploadService.deleteImage(path, filename);
      return { 
        success: result.success, 
        message: result.success ? 'Image deleted successfully' : 'Failed to delete image' 
      };
    } catch (error: any) {
      console.error(`Error deleting image ${filename}:`, error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  async getImageInfo(path: string, filename: string): Promise<{ exists: boolean; size?: number; createdAt?: Date }> {
    try {
      return await this.imageUploadService.getImageInfo(path, filename);
    } catch (error: any) {
      console.error(`Error getting image info for ${filename}:`, error);
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  // ==================== GENERAL FILE UPLOAD MANAGEMENT ====================

  async uploadFile(fileRequest: FileUploadRequest): Promise<FileUploadResponse> {
    try {
      return await this.fileUploadService.uploadFile(fileRequest);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(path: string, filename: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.fileUploadService.deleteFile(path, filename);
      return { 
        success: result.success, 
        message: result.success ? 'File deleted successfully' : 'Failed to delete file' 
      };
    } catch (error: any) {
      console.error(`Error deleting file ${filename}:`, error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileInfo(path: string, filename: string): Promise<{ exists: boolean; size?: number; createdAt?: Date }> {
    try {
      return await this.fileUploadService.getFileInfo(path, filename);
    } catch (error: any) {
      console.error(`Error getting file info for ${filename}:`, error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // ==================== UTILITY METHODS ====================

  getSupportedImageTypes(): string[] {
    return this.imageUploadService.getSupportedImageTypes();
  }

  getMaxImageSize(): number {
    return this.imageUploadService.getMaxImageSize();
  }

  async validateImageFile(file: Express.Multer.File): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!file) {
        return { valid: false, error: 'No file provided' };
      }

      const supportedTypes = this.getSupportedImageTypes();
      const isValidType = await this.fileUploadService.validateFileType(file, supportedTypes);
      
      if (!isValidType) {
        return { valid: false, error: 'Invalid file type. Only images are allowed.' };
      }

      const maxSize = this.getMaxImageSize();
      const isValidSize = await this.fileUploadService.validateFileSize(file, maxSize);
      
      if (!isValidSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
      }

      return { valid: true };
    } catch (error: any) {
      console.error('Error validating image file:', error);
      return { valid: false, error: 'Failed to validate file' };
    }
  }
}