import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { mkdir, open, unlink } from 'fs/promises';

import { UploadFacadeService } from './upload.facade.service';
import { UploadImageDto, UploadFileDto, DeleteFileDto } from './dto/upload.dto';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';
import { CurrentUser, AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  extensionMatchesSniff,
  extensionOf,
  resolveWithinUploads,
  safeFilename,
  safeSubdir,
  sniffImageExtension,
} from './safe-path';

/**
 * Multer storage used by both upload routes.
 *
 * Both callbacks run as the request body streams in — before the global
 * `ValidationPipe`, and before any service code — so this is the only layer that
 * can stop a traversal. Previously `destination` and `filename` took
 * `req.body.path` / `req.body.filename` verbatim, and multer writes to
 * `join(destination, filename)`: a filename of `../../../public/evil.html` put
 * attacker bytes outside the uploads root. The service's own `validateFilename`
 * did reject it, but only afterwards, and throwing there left the file exactly
 * where multer had already put it.
 */
function safeDiskStorage(allowed: ReadonlySet<string>) {
  return diskStorage({
    destination: async (req, _file, callback) => {
      try {
        const subdir = safeSubdir((req.body as Record<string, unknown>)?.path);
        const uploadPath = resolveWithinUploads(subdir);
        await mkdir(uploadPath, { recursive: true });
        callback(null, uploadPath);
      } catch (error: any) {
        callback(error, '');
      }
    },
    filename: (req, file, callback) => {
      try {
        callback(
          null,
          safeFilename(
            (req.body as Record<string, unknown>)?.filename,
            file.originalname,
            allowed,
          ),
        );
      } catch (error: any) {
        callback(error, '');
      }
    },
  });
}

function imageFileFilter(
  _req: unknown,
  file: { originalname: string; mimetype: string },
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  const declaredType = (file.mimetype ?? '').toLowerCase();
  const extension = extensionOf(file.originalname ?? '');

  if (
    !declaredType.startsWith('image/') ||
    !ALLOWED_IMAGE_EXTENSIONS.has(extension)
  ) {
    return callback(
      new BadRequestException('Only image files are allowed!'),
      false,
    );
  }
  callback(null, true);
}

/**
 * Confirms the bytes really are the image type the extension claims, and
 * removes the file if they are not. The extension check above is on a
 * client-supplied name; this reads the file multer just wrote, so a `.png`
 * carrying HTML or a script is deleted before anything can serve it.
 */
async function assertImageContent(file: Express.Multer.File): Promise<void> {
  const head = Buffer.alloc(16);
  const handle = await open(file.path, 'r');
  try {
    await handle.read(head, 0, head.length, 0);
  } finally {
    await handle.close();
  }

  const sniffed = sniffImageExtension(head);
  if (!sniffed || !extensionMatchesSniff(extensionOf(file.filename), sniffed)) {
    await unlink(file.path).catch(() => undefined);
    throw new BadRequestException(
      'That file is not a valid image. Upload a JPG, PNG, GIF or WebP.',
    );
  }
}

@ApiTags('BoffMedia 🛠 | Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@SkipEnvelope()
export class UploadController {
  constructor(private readonly uploadFacadeService: UploadFacadeService) {}

  // ==================== IMAGE UPLOAD ENDPOINTS ====================

  @Post('image')
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image uploaded successfully.',
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
            mimetype: { type: 'string', example: 'image/jpeg' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file type or no file provided.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: safeDiskStorage(ALLOWED_IMAGE_EXTENSIONS),
      fileFilter: imageFileFilter,
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
    @CurrentUser() actor?: AuthPrincipal,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!actor) {
      throw new BadRequestException('Authentication required');
    }

    await assertImageContent(file);

    // multer has already validated both values and written the bytes to a
    // location inside the uploads root. Reuse exactly what it produced instead
    // of re-deriving from the raw body, so there is only one sanitised value in
    // play and the service's move becomes a no-op rather than a second chance
    // to go somewhere else.
    const result = await this.uploadFacadeService.uploadImage({
      file,
      path: safeSubdir(path),
      filename: file.filename,
      maxSizeInMB: maxSizeInMB || 5,
      actor,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Post('file')
  @ApiOperation({ summary: 'Upload any file type' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File uploaded successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No file provided.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: safeDiskStorage(ALLOWED_FILE_EXTENSIONS),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for general files
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('path') path?: string | string[],
    @Body('filename') filename?: string | string[],
    @CurrentUser() actor?: AuthPrincipal,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!actor) {
      throw new BadRequestException('Authentication required');
    }

    // As in uploadImage: multer already produced sanitised values, so pass
    // those on rather than the raw body fields.
    const result = await this.uploadFacadeService.uploadFile({
      file,
      path: safeSubdir(path),
      filename: file.filename,
      actor,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'File uploaded successfully',
      data: result,
    };
  }

  // ==================== FILE MANAGEMENT ENDPOINTS ====================

  @Delete('file')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiBody({ type: DeleteFileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'File not found.',
  })
  async deleteFile(
    @Body() deleteFileDto: DeleteFileDto,
    @CurrentUser() actor?: AuthPrincipal,
  ) {
    if (!actor) {
      throw new BadRequestException('Authentication required');
    }

    const result = await this.uploadFacadeService.deleteFile(
      deleteFileDto.path || '',
      deleteFileDto.filename,
      actor,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: { success: result.success },
    };
  }

  @Get('info')
  @ApiOperation({ summary: 'Get file information' })
  @ApiQuery({ name: 'path', required: false, description: 'File path' })
  @ApiQuery({ name: 'filename', required: true, description: 'Filename' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File information retrieved successfully.',
  })
  async getFileInfo(
    @Query('path') path?: string,
    @Query('filename') filename?: string,
    @CurrentUser() actor?: AuthPrincipal,
  ) {
    if (!filename) {
      throw new BadRequestException('Filename is required');
    }

    if (!actor) {
      throw new BadRequestException('Authentication required');
    }

    const result = await this.uploadFacadeService.getFileInfo(
      path || '',
      filename,
      actor,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'File information retrieved successfully',
      data: result,
    };
  }

  // ==================== UTILITY ENDPOINTS ====================

  @Get('supported-types')
  @ApiOperation({ summary: 'Get supported image file types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supported types retrieved successfully.',
  })
  async getSupportedImageTypes() {
    const types = this.uploadFacadeService.getSupportedImageTypes();

    return {
      statusCode: HttpStatus.OK,
      message: 'Supported image types retrieved successfully',
      data: { supportedTypes: types },
    };
  }

  @Get('limits')
  @ApiOperation({ summary: 'Get upload limits' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload limits retrieved successfully.',
  })
  async getUploadLimits() {
    const maxImageSize = this.uploadFacadeService.getMaxImageSize();

    return {
      statusCode: HttpStatus.OK,
      message: 'Upload limits retrieved successfully',
      data: {
        maxImageSizeBytes: maxImageSize,
        maxImageSizeMB: Math.round(maxImageSize / (1024 * 1024)),
      },
    };
  }
}
