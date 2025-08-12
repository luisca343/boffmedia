import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface UploadedFileDetails {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  uploadDir: string;
  url: string;
  createdAt: Date;
}

export interface FileUploadData {
  file: Express.Multer.File;
  destinationPath?: string;
  customFilename?: string;
}

@Injectable()
export class UploadRepository {
  private readonly baseUploadDir = join(process.cwd(), 'public', 'uploads');

  // ==================== DIRECTORY OPERATIONS ====================

  async ensureDirectoryExists(path: string): Promise<void> {
    await fs.mkdir(path, { recursive: true });
  }

  async getUploadDirectory(subPath?: string): Promise<string> {
    const uploadDir = subPath ? join(this.baseUploadDir, subPath) : this.baseUploadDir;
    await this.ensureDirectoryExists(uploadDir);
    return uploadDir;
  }

  // ==================== FILE OPERATIONS ====================

  async saveFile(sourceFilePath: string, destinationPath: string, filename: string): Promise<UploadedFileDetails> {
    const finalFilePath = join(destinationPath, filename);
    
    // Move file from temp location to final destination
    await fs.rename(sourceFilePath, finalFilePath);

    // Get file stats
    const stats = await fs.stat(finalFilePath);

    return {
      filename,
      originalName: filename,
      path: finalFilePath,
      mimetype: '', // Will be set by service
      size: stats.size,
      uploadDir: destinationPath,
      url: '', // Will be constructed by service
      createdAt: new Date()
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, which is okay
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileInfo(filePath: string): Promise<{ size: number; createdAt: Date } | null> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        createdAt: stats.birthtime
      };
    } catch {
      return null;
    }
  }

  // ==================== PATH UTILITIES ====================

  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    return `${timestamp}-${random}${extension}`;
  }

  constructUrlPath(subPath?: string, filename?: string): string {
    if (!filename) return '';
    
    const urlPath = subPath ? `uploads/${subPath}/${filename}` : `uploads/${filename}`;
    return `/${urlPath}`;
  }

  sanitizePath(path: string): string {
    // Remove any dangerous path traversal attempts
    return path.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
  }

  validateFilename(filename: string): boolean {
    // Check for valid filename characters
    const invalidChars = /[<>:"|?*\\\/]/;
    return !invalidChars.test(filename) && filename.length > 0 && filename.length <= 255;
  }
}