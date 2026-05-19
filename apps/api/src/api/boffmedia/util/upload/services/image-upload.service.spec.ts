import { Test, TestingModule } from '@nestjs/testing';
import { ImageUploadService } from './image-upload.service';
import { FileUploadService } from './file-upload.service';

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
    path: `/tmp/${name}`,
  }) as Express.Multer.File;

describe('ImageUploadService', () => {
  let service: ImageUploadService;

  beforeEach(async () => {
    jest.clearAllMocks();
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

      const result = await service.uploadImage({ file });

      expect(result.url).toBe('/uploads/photo.jpg');
      expect(mockFileUploadService.uploadFile).toHaveBeenCalled();
    });

    it('throws when no file is provided', async () => {
      await expect(service.uploadImage({ file: null as any })).rejects.toThrow(
        'No image file provided',
      );
    });

    it('throws when file type is not an allowed image type', async () => {
      mockFileUploadService.validateFileType.mockResolvedValue(false);

      await expect(
        service.uploadImage({ file: makeFile('doc.pdf') }),
      ).rejects.toThrow('Only image files');
    });

    it('throws when file exceeds default size limit (5MB)', async () => {
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(false);

      await expect(
        service.uploadImage({ file: makeFile('big.jpg', 10 * 1024 * 1024) }),
      ).rejects.toThrow('Image size must be less than');
    });

    it('uses custom maxSizeInMB when provided', async () => {
      const file = makeFile();
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);
      mockFileUploadService.uploadFile.mockResolvedValue({} as any);

      await service.uploadImage({ file, maxSizeInMB: 10 });

      expect(mockFileUploadService.validateFileSize).toHaveBeenCalledWith(
        file,
        10 * 1024 * 1024,
      );
    });
  });

  // ─── deleteImage ──────────────────────────────────────────────────────────────

  describe('deleteImage()', () => {
    it('delegates deletion to FileUploadService', async () => {
      mockFileUploadService.deleteFile.mockResolvedValue({ success: true });

      await expect(service.deleteImage('', 'photo.jpg')).resolves.toEqual({
        success: true,
      });
      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith(
        '',
        'photo.jpg',
      );
    });
  });

  // ─── getImageInfo ─────────────────────────────────────────────────────────────

  describe('getImageInfo()', () => {
    it('delegates to FileUploadService', async () => {
      mockFileUploadService.getFileInfo.mockResolvedValue({
        exists: true,
        size: 512,
      });

      await expect(
        service.getImageInfo('', 'photo.jpg'),
      ).resolves.toMatchObject({ exists: true });
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
});
