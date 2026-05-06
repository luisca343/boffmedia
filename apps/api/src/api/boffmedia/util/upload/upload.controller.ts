import { 
  BadRequestException, 
  Body, 
  Controller, 
  Delete, 
  Get, 
  HttpStatus, 
  Param, 
  Post, 
  Query,
  UploadedFile, 
  UseInterceptors 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdir } from 'fs/promises';

import { UploadFacadeService } from './upload.facade.service';
import { UploadImageDto, UploadFileDto, DeleteFileDto } from './dto/upload.dto';

@ApiTags("BoffMedia 🛠 | Upload")
@Controller("upload")
export class UploadController {
  constructor(
    private readonly uploadFacadeService: UploadFacadeService,
  ) {}

  // ==================== IMAGE UPLOAD ENDPOINTS ====================

  @Post("image")
  @ApiOperation({ summary: "Upload an image file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadImageDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: "Image uploaded successfully.",
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Image uploaded successfully' },
        data: {
          type: 'object',
          properties: {
            filename: { type: 'string', example: 'image.jpg' },
            path: { type: 'string', example: 'uploads/images/image.jpg' },
            url: { type: 'string', example: '/uploads/images/image.jpg' },
            size: { type: 'number', example: 1024000 },
            mimetype: { type: 'string', example: 'image/jpeg' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid file type or no file provided." })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: async (req, file, callback) => {
          try {
            const pathValue = Array.isArray(req.body.path) ? req.body.path[0] : req.body.path;
            const uploadPath = pathValue
              ? join(process.cwd(), "public", "uploads", pathValue)
              : join(process.cwd(), "public", "uploads");

            await mkdir(uploadPath, { recursive: true });
            callback(null, uploadPath);
          } catch (error: any) {
            callback(error, "");
          }
        },
        filename: (req, file, callback) => {
          try {
            const providedFilename = Array.isArray(req.body.filename) ? req.body.filename[0] : req.body.filename;
            
            if (providedFilename) {
              callback(null, providedFilename);
            } else {
              const generatedFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
              callback(null, generatedFilename);
            }
          } catch (error: any) {
            callback(error, "");
          }
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException("Only image files are allowed!"), false);
        }
        callback(null, true);
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
    @Body('maxSizeInMB') maxSizeInMB?: number,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const pathString = Array.isArray(path) ? path[0] : path;
    const filenameString = Array.isArray(filename) ? filename[0] : filename;

    const result = await this.uploadFacadeService.uploadImage({
      file,
      path: pathString,
      filename: filenameString,
      maxSizeInMB: maxSizeInMB || 5
    });

    return {
      statusCode: HttpStatus.OK,
      message: "Image uploaded successfully",
      data: result,
    };
  }

  @Post("file")
  @ApiOperation({ summary: "Upload any file type" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadFileDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: "File uploaded successfully.",
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "No file provided." })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: async (req, file, callback) => {
          try {
            const pathValue = Array.isArray(req.body.path) ? req.body.path[0] : req.body.path;
            const uploadPath = pathValue
              ? join(process.cwd(), "public", "uploads", pathValue)
              : join(process.cwd(), "public", "uploads");

            await mkdir(uploadPath, { recursive: true });
            callback(null, uploadPath);
          } catch (error: any) {
            callback(error, "");
          }
        },
        filename: (req, file, callback) => {
          try {
            const providedFilename = Array.isArray(req.body.filename) ? req.body.filename[0] : req.body.filename;
            
            if (providedFilename) {
              callback(null, providedFilename);
            } else {
              const generatedFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
              callback(null, generatedFilename);
            }
          } catch (error: any) {
            callback(error, "");
          }
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for general files
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('path') path?: string | string[],
    @Body('filename') filename?: string | string[],
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const pathString = Array.isArray(path) ? path[0] : path;
    const filenameString = Array.isArray(filename) ? filename[0] : filename;

    const result = await this.uploadFacadeService.uploadFile({
      file,
      path: pathString,
      filename: filenameString,
    });

    return {
      statusCode: HttpStatus.OK,
      message: "File uploaded successfully",
      data: result,
    };
  }

  // ==================== FILE MANAGEMENT ENDPOINTS ====================

  @Delete("file")
  @ApiOperation({ summary: "Delete a file" })
  @ApiBody({ type: DeleteFileDto })
  @ApiResponse({ status: HttpStatus.OK, description: "File deleted successfully." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "File not found." })
  async deleteFile(@Body() deleteFileDto: DeleteFileDto) {
    const result = await this.uploadFacadeService.deleteFile(
      deleteFileDto.path || '',
      deleteFileDto.filename
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: { success: result.success },
    };
  }

  @Get("info")
  @ApiOperation({ summary: "Get file information" })
  @ApiQuery({ name: 'path', required: false, description: 'File path' })
  @ApiQuery({ name: 'filename', required: true, description: 'Filename' })
  @ApiResponse({ status: HttpStatus.OK, description: "File information retrieved successfully." })
  async getFileInfo(
    @Query('path') path?: string,
    @Query('filename') filename?: string,
  ) {
    if (!filename) {
      throw new BadRequestException("Filename is required");
    }

    const result = await this.uploadFacadeService.getFileInfo(path || '', filename);

    return {
      statusCode: HttpStatus.OK,
      message: "File information retrieved successfully",
      data: result,
    };
  }

  // ==================== UTILITY ENDPOINTS ====================

  @Get("supported-types")
  @ApiOperation({ summary: "Get supported image file types" })
  @ApiResponse({ status: HttpStatus.OK, description: "Supported types retrieved successfully." })
  async getSupportedImageTypes() {
    const types = this.uploadFacadeService.getSupportedImageTypes();
    
    return {
      statusCode: HttpStatus.OK,
      message: "Supported image types retrieved successfully",
      data: { supportedTypes: types },
    };
  }

  @Get("limits")
  @ApiOperation({ summary: "Get upload limits" })
  @ApiResponse({ status: HttpStatus.OK, description: "Upload limits retrieved successfully." })
  async getUploadLimits() {
    const maxImageSize = this.uploadFacadeService.getMaxImageSize();
    
    return {
      statusCode: HttpStatus.OK,
      message: "Upload limits retrieved successfully",
      data: { 
        maxImageSizeBytes: maxImageSize,
        maxImageSizeMB: Math.round(maxImageSize / (1024 * 1024))
      },
    };
  }
}