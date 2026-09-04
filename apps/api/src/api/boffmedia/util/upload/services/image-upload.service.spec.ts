import { Test, TestingModule } from '@nestjs/testing';
import { PayloadTooLargeException, BadRequestException } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { FileUploadService } from './file-upload.service';
import { AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import { env } from '@/config/env';
import sharp from 'sharp';

// Mock sharp at module level for easier control
jest.mock('sharp');

const mockFileUploadService = {
  validateFileType: jest.fn(),
  validateFileSize: jest.fn(),
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileInfo: jest.fn(),
};

const makeFile = (
  name = 'photo.jpg',
  size = 1024 * 1024,
  mimetype = 'image/jpeg',
) =>
  ({
    originalname: name,
    filename: name,
    mimetype,
    size,
    buffer: Buffer.alloc(size), // Use buffer instead of path to avoid file system access
  }) as Express.Multer.File;

const makeActor = (userId = 1): AuthPrincipal => ({
  userId,
  username: `user${userId}`,
});

describe('ImageUploadService', () => {
  let service: ImageUploadService;
  const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock: return valid dimensions for non-A16 tests
    mockSharp.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({
        width: 1024,
        height: 768,
        format: 'jpeg',
      }),
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageUploadService,
        { provide: FileUploadService, useValue: mockFileUploadService },
      ],
    }).compile();

    service = module.get<ImageUploadService>(ImageUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── uploadImage ──────────────────────────────────────────────────────────────

  describe('uploadImage()', () => {
    it('uploads valid image and returns response', async () => {
      const file = makeFile();
      const actor = makeActor();
      const uploadResult = {
        filename: 'photo.jpg',
        path: '/uploads/photo.jpg',
        url: '/uploads/photo.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
      };
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);
      mockFileUploadService.uploadFile.mockResolvedValue(uploadResult);

      const result = await service.uploadImage({ file, actor });

      expect(result.url).toBe('/uploads/photo.jpg');
      expect(mockFileUploadService.uploadFile).toHaveBeenCalled();
    });

    it('throws when no file is provided', async () => {
      const actor = makeActor();
      await expect(
        service.uploadImage({ file: null as any, actor }),
      ).rejects.toThrow('No image file provided');
    });

    it('throws when file type is not an allowed image type', async () => {
      const actor = makeActor();
      mockFileUploadService.validateFileType.mockResolvedValue(false);

      await expect(
        service.uploadImage({ file: makeFile('doc.pdf'), actor }),
      ).rejects.toThrow('Only image files');
    });

    it('throws when file exceeds default size limit (5MB)', async () => {
      const actor = makeActor();
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(false);

      await expect(
        service.uploadImage({
          file: makeFile('big.jpg', 10 * 1024 * 1024),
          actor,
        }),
      ).rejects.toThrow('Image size must be less than');
    });

    it('uses custom maxSizeInMB when provided', async () => {
      const file = makeFile();
      const actor = makeActor();
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);
      mockFileUploadService.uploadFile.mockResolvedValue({} as any);

      await service.uploadImage({ file, maxSizeInMB: 10, actor });

      expect(mockFileUploadService.validateFileSize).toHaveBeenCalledWith(
        file,
        10 * 1024 * 1024,
      );
    });
  });

  // ─── deleteImage ──────────────────────────────────────────────────────────────

  describe('deleteImage()', () => {
    it('delegates deletion to FileUploadService', async () => {
      const actor = makeActor();
      mockFileUploadService.deleteFile.mockResolvedValue({ success: true });

      await expect(service.deleteImage('', 'photo.jpg', actor)).resolves.toEqual({
        success: true,
      });
      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith(
        '',
        'photo.jpg',
        actor,
      );
    });
  });

  // ─── getImageInfo ─────────────────────────────────────────────────────────────

  describe('getImageInfo()', () => {
    it('delegates to FileUploadService', async () => {
      const actor = makeActor();
      mockFileUploadService.getFileInfo.mockResolvedValue({
        exists: true,
        size: 512,
      });

      await expect(
        service.getImageInfo('', 'photo.jpg', actor),
      ).resolves.toMatchObject({ exists: true });
      expect(mockFileUploadService.getFileInfo).toHaveBeenCalledWith(
        '',
        'photo.jpg',
        actor,
      );
    });
  });

  // ─── utility methods ──────────────────────────────────────────────────────────

  describe('getSupportedImageTypes()', () => {
    it('returns a list of allowed extensions', () => {
      const types = service.getSupportedImageTypes();

      expect(types).toContain('.jpg');
      expect(types).toContain('.png');
      expect(types).toContain('.webp');
    });
  });

  describe('getMaxImageSize()', () => {
    it('returns 5MB in bytes as the default limit', () => {
      expect(service.getMaxImageSize()).toBe(5 * 1024 * 1024);
    });
  });

  // ─── A16: Image dimension validation ──────────────────────────────────────────
  describe('A16: dimension validation via validateImageDimensions', () => {
    it('rejects image exceeding MAX_IMAGE_WIDTH', async () => {
      const actor = makeActor();
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);

      // Mock sharp to return oversized width
      mockSharp.mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: env.MAX_IMAGE_WIDTH + 100,
          height: 100,
          format: 'png',
        }),
      } as any);

      const file = makeFile('wide.png');

      const error = await service
        .uploadImage({ file, actor })
        .catch((e) => e);

      expect(error).toBeInstanceOf(PayloadTooLargeException);
      expect(error.message).toContain('Image dimensions exceed');
      expect(mockFileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('rejects image exceeding MAX_IMAGE_HEIGHT', async () => {
      const actor = makeActor();
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);

      // Mock sharp to return oversized height
      mockSharp.mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 100,
          height: env.MAX_IMAGE_HEIGHT + 200,
          format: 'png',
        }),
      } as any);

      const file = makeFile('tall.png');

      const error = await service
        .uploadImage({ file, actor })
        .catch((e) => e);

      expect(error).toBeInstanceOf(PayloadTooLargeException);
      expect(error.message).toContain('Image dimensions exceed');
      expect(mockFileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('accepts image within dimension limits', async () => {
      const actor = makeActor();
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);
      mockFileUploadService.uploadFile.mockResolvedValue({
        filename: 'valid.png',
        path: '/uploads/valid.png',
        url: '/uploads/valid.png',
        size: 1024,
        mimetype: 'image/png',
      });

      // Mock sharp to return valid dimensions
      mockSharp.mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 1024,
          height: 768,
          format: 'png',
        }),
      } as any);

      const file = makeFile('valid.png');

      const result = await service.uploadImage({ file, actor });

      expect(result.filename).toBe('valid.png');
      expect(mockFileUploadService.uploadFile).toHaveBeenCalled();
    });

    it('rejects when image dimensions cannot be determined', async () => {
      const actor = makeActor();
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);

      // Mock sharp to return missing dimensions
      mockSharp.mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          format: 'png',
          // missing width/height
        }),
      } as any);

      const file = makeFile('nodim.png');

      const error = await service
        .uploadImage({ file, actor })
        .catch((e) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toContain('Cannot determine image dimensions');
    });
  });
});
