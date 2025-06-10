import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  constructor() {}

  async saveImage(file: Express.Multer.File, path?: string | null, filename?: string | null) {
    try {
      if (!file) {
        throw new BadRequestException("No file provided")
      }

      // Log the received file information
      console.log("Service received file:", {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        destination: file.destination,
      })

      // Get absolute paths
      const baseDir = join(process.cwd(), "public", "uploads")
      const uploadDir = path ? join(baseDir, path.toString()) : baseDir

      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true })

      // Use provided filename or keep the original one
      const finalFilename = filename || file.filename
      const newFilePath = join(uploadDir, finalFilename)

      // Move the file to the correct location with the correct name
      await fs.rename(file.path, newFilePath)

      return {
        filename: finalFilename,
        path: newFilePath,
        mimetype: file.mimetype,
        size: file.size,
        uploadDir,
      }
    } catch (error) {
      console.error("Error in saveImage:", error)
      throw new BadRequestException("Failed to save image: " + error.message)
    }
  }
}

