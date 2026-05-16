import { Injectable, BadRequestException } from '@nestjs/common';
import {
  UploadRepository,
  UploadedFileDetails,
} from '@repositories/boffmedia/upload.repository';

export interface FileUploadRequest {
  file: Express.Multer.File;
  path?: string;
  filename?: string;
}

export interface FileUploadResponse {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class FileUploadService {
  constructor(private readonly uploadRepository: UploadRepository) {}

  async uploadFile(
    uploadRequest: FileUploadRequest,
  ): Promise<FileUploadResponse> {
    const { file, path, filename } = uploadRequest;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate and sanitize inputs
    const sanitizedPath = path
      ? this.uploadRepository.sanitizePath(path)
      : undefined;
    const finalFilename = this.determineFinalFilename(file, filename);

    if (!this.uploadRepository.validateFilename(finalFilename)) {
      throw new BadRequestException('Invalid filename provided');
    }

    // Get upload directory
    const uploadDir =
      await this.uploadRepository.getUploadDirectory(sanitizedPath);

    // Save the file
    const uploadedFile = await this.uploadRepository.saveFile(
      file.path,
      uploadDir,
      finalFilename,
    );

    // Construct URL
    const url = this.uploadRepository.constructUrlPath(
      sanitizedPath,
      finalFilename,
    );

    return {
      filename: finalFilename,
      path: uploadedFile.path,
      url,
      size: uploadedFile.size,
      mimetype: file.mimetype,
    };
  }

  async deleteFile(
    path: string,
    filename: string,
  ): Promise<{ success: boolean }> {
    if (!filename) {
      throw new BadRequestException('Filename is required');
    }

    const sanitizedPath = path
      ? this.uploadRepository.sanitizePath(path)
      : undefined;
    const uploadDir =
      await this.uploadRepository.getUploadDirectory(sanitizedPath);
    const filePath = require('path').join(uploadDir, filename);

    const exists = await this.uploadRepository.fileExists(filePath);
    if (!exists) {
      throw new BadRequestException('File not found');
    }

    await this.uploadRepository.deleteFile(filePath);
    return { success: true };
  }

  async getFileInfo(
    path: string,
    filename: string,
  ): Promise<{ exists: boolean; size?: number; createdAt?: Date }> {
    if (!filename) {
      throw new BadRequestException('Filename is required');
    }

    const sanitizedPath = path
      ? this.uploadRepository.sanitizePath(path)
      : undefined;
    const uploadDir =
      await this.uploadRepository.getUploadDirectory(sanitizedPath);
    const filePath = require('path').join(uploadDir, filename);

    const exists = await this.uploadRepository.fileExists(filePath);
    if (!exists) {
      return { exists: false };
    }

    const fileInfo = await this.uploadRepository.getFileInfo(filePath);
    return {
      exists: true,
      size: fileInfo?.size,
      createdAt: fileInfo?.createdAt,
    };
  }

  private determineFinalFilename(
    file: Express.Multer.File,
    customFilename?: string,
  ): string {
    if (customFilename) {
      return customFilename;
    }

    if (file.filename) {
      return file.filename;
    }

    return this.uploadRepository.generateUniqueFilename(file.originalname);
  }

  async validateFileType(
    file: Express.Multer.File,
    allowedTypes: string[],
  ): Promise<boolean> {
    if (!file || !file.originalname) {
      return false;
    }

    const extension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));
    return allowedTypes.includes(extension);
  }

  async validateFileSize(
    file: Express.Multer.File,
    maxSizeInBytes: number,
  ): Promise<boolean> {
    return file && file.size <= maxSizeInBytes;
  }
}
