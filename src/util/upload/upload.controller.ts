import { BadRequestException, Body, Controller, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdir } from 'fs/promises';

export class UploadDto {
    @ApiProperty({ type: 'string', required: true })
    path: string;
  
    @ApiProperty({ type: 'string', required: true })
    filename: string;
  
    @ApiProperty({ type: 'file', required: true })
    file: Express.Multer.File;
  }
  
  @ApiTags("upload")
  @Controller("upload")
  export class UploadController {
    constructor(private readonly uploadService: UploadService) {}
  
    @Post("image")
    @ApiConsumes("multipart/form-data")
    @ApiResponse({ status: HttpStatus.OK, description: "Image uploaded successfully." })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid file type or no file provided." })
    @UseInterceptors(
      FileInterceptor("file", {
        storage: diskStorage({
          destination: async (req, file, callback) => {
            try {
              // Get path from form data (handle array case)
              const pathValue = Array.isArray(req.body.path) ? req.body.path[0] : req.body.path
  
              // Create full upload path including the custom path
              const uploadPath = pathValue
                ? join(process.cwd(), "public", "uploads", pathValue)
                : join(process.cwd(), "public", "uploads")
  
              console.log("Creating directory at:", uploadPath)
  
              // Create directory
              await mkdir(uploadPath, { recursive: true })
  
              callback(null, uploadPath)
            } catch (error) {
              console.error("Destination error:", error)
              callback(error, "")
            }
          },
          filename: (req, file, callback) => {
            try {
              // Get filename from form data (handle array case)
              const providedFilename = Array.isArray(req.body.filename) ? req.body.filename[0] : req.body.filename
  
              if (providedFilename) {
                console.log("Using provided filename:", providedFilename)
                callback(null, providedFilename)
              } else {
                // Generate a filename if none provided
                const generatedFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`
                console.log("Using generated filename:", generatedFilename)
                callback(null, generatedFilename)
              }
            } catch (error) {
              console.error("Filename error:", error)
              callback(error, "")
            }
          },
        }),
        fileFilter: (req, file, callback) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            return callback(new BadRequestException("Only image files are allowed!"), false)
          }
          callback(null, true)
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
        },
      }),
    )
    async uploadImage(
      @UploadedFile() file: Express.Multer.File,
      @Body('path') path?: string | string[],
      @Body('filename') filename?: string | string[],
    ) {
      if (!file) {
        throw new BadRequestException("No file uploaded")
      }
  
      const pathString = Array.isArray(path) ? path[0] : path
      const filenameString = Array.isArray(filename) ? filename[0] : filename
  
      console.log("Processing upload:", {
        file,
        pathString,
        filenameString,
      })
  
      const uploadedFile = await this.uploadService.saveImage(file, pathString, filenameString)
  
      // Construct URL path
      const urlPath = pathString ? `uploads/${pathString}/${uploadedFile.filename}` : `uploads/${uploadedFile.filename}`
  
      return {
        statusCode: HttpStatus.OK,
        message: "Image uploaded successfully",
        data: {
          filename: uploadedFile.filename,
          path: urlPath,
          url: `/${urlPath}`,
        },
      }
    }
  }
  
  