import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { UploadRepository } from '@repositories/boffmedia/upload.repository';
import { UploadsRepository } from '@repositories/boffmedia/uploads.repository';
import { AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import {
  assertWithinUploads,
  resolveWithinUploads,
  safeExistingFilename,
  safeSubdir,
} from '../safe-path';

export interface FileUploadRequest {
  file: Express.Multer.File;
  path?: string;
  filename?: string;
  actor: AuthPrincipal;
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
  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly uploadsRepository: UploadsRepository,
  ) {}

  async uploadFile(
    uploadRequest: FileUploadRequest,
  ): Promise<FileUploadResponse> {
    const { file, path, filename, actor } = uploadRequest;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!actor) {
      throw new BadRequestException('Actor is required');
    }

    // `safeSubdir` throws on anything that is not a plain relative folder, so
    // a rejected path never reaches `join`. The filename is whatever multer
    // already wrote, re-validated here because this service is also reachable
    // from callers that do not go through the controller's storage engine.
    const sanitizedPath = safeSubdir(path) ?? '';
    const finalFilename = safeExistingFilename(
      this.determineFinalFilename(file, filename),
    );

    // Get upload directory
    const uploadDir =
      await this.uploadRepository.getUploadDirectory(sanitizedPath);

    // Handle both disk storage (file.path) and memory storage (file.buffer).
    // Disk storage: multer already wrote the file, so move it to the final destination.
    // Memory storage: the file is in memory, so write it to the destination.
    let uploadedFile;
    if (file.path) {
      uploadedFile = await this.uploadRepository.saveFile(
        file.path,
        uploadDir,
        finalFilename,
      );
    } else if (file.buffer) {
      // Write into the directory the repository just created, rather than
      // re-deriving the path from the raw inputs: two independent sources for
      // one path drift the moment either side changes (and made the write land
      // somewhere the mkdir had not happened). `assertWithinUploads` keeps the
      // containment guarantee on the value actually used.
      const finalPath = assertWithinUploads(join(uploadDir, finalFilename));
      await fs.writeFile(finalPath, file.buffer);
      const stats = await fs.stat(finalPath);
      uploadedFile = {
        filename: finalFilename,
        originalName: finalFilename,
        path: finalPath,
        mimetype: file.mimetype,
        size: stats.size,
        uploadDir,
        url: '',
        createdAt: new Date(),
      };
    } else {
      throw new BadRequestException('File must have either path or buffer');
    }

    // Register ownership after successful write
    try {
      await this.uploadsRepository.registerUpload(
        actor.userId,
        sanitizedPath,
        finalFilename,
        file.mimetype,
        uploadedFile.size,
      );
    } catch (error: any) {
      // If registration fails (e.g., duplicate location), delete the file and throw.
      // This keeps the disk and the database in sync.
      try {
        await this.uploadRepository.deleteFile(uploadedFile.path);
      } catch {
        // Log but don't re-throw: the registration error is more informative.
      }
      throw error;
    }

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
    actor: AuthPrincipal,
  ): Promise<{ success: boolean }> {
    if (!actor) {
      throw new BadRequestException('Actor is required');
    }

    // Both values are validated before they touch the filesystem: this used to
    // join an unvalidated `filename` onto the upload directory, so
    // `filename: '../../../x'` deleted any file the process could reach.
    const sanitizedPath = safeSubdir(path) ?? '';
    const safeName = safeExistingFilename(filename);
    const filePath = resolveWithinUploads(sanitizedPath, safeName);

    const exists = await this.uploadRepository.fileExists(filePath);
    if (!exists) {
      throw new BadRequestException('File not found');
    }

    // Check ownership: the actor must own the file or be a BoffMedia admin.
    // Files with no row are legacy (pre-dating this table) and admin-only.
    const upload = await this.uploadsRepository.findByLocation(sanitizedPath, safeName);
    const isAdmin = actor.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;

    if (!upload) {
      // Legacy file — admin-only
      if (!isAdmin) {
        throw new ForbiddenException('Cannot delete legacy file: admin access required');
      }
    } else if (upload.ownerUserId !== actor.userId && !isAdmin) {
      // Non-legacy file — owner or admin only
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    await this.uploadRepository.deleteFile(filePath);

    // Mark the ownership record as deleted if it exists.
    if (upload) {
      await this.uploadsRepository.markDeleted(upload.id);
    }

    return { success: true };
  }

  async getFileInfo(
    path: string,
    filename: string,
    actor: AuthPrincipal,
  ): Promise<{ exists: boolean; size?: number; createdAt?: Date }> {
    if (!actor) {
      throw new BadRequestException('Actor is required');
    }

    const sanitizedPath = safeSubdir(path) ?? '';
    const safeName = safeExistingFilename(filename);
    const filePath = resolveWithinUploads(sanitizedPath, safeName);

    const exists = await this.uploadRepository.fileExists(filePath);
    if (!exists) {
      return { exists: false };
    }

    // Check ownership: the actor must own the file or be a BoffMedia admin.
    // Files with no row are legacy (pre-dating this table) and admin-only.
    const upload = await this.uploadsRepository.findByLocation(sanitizedPath, safeName);
    const isAdmin = actor.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;

    if (!upload) {
      // Legacy file — admin-only
      if (!isAdmin) {
        throw new ForbiddenException('Cannot access legacy file: admin access required');
      }
    } else if (upload.ownerUserId !== actor.userId && !isAdmin) {
      // Non-legacy file — owner or admin only
      throw new ForbiddenException('You do not have permission to access this file');
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
