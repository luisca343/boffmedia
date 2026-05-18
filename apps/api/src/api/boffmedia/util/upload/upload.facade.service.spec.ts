import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { UploadFacadeService } from './upload.facade.service';
import { FileUploadService } from './services/file-upload.service';
import { ImageUploadService } from './services/image-upload.service';

const mockFileUploadService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileInfo: jest.fn(),
  validateFileType: jest.fn(),
  validateFileSize: jest.fn(),
};

const mockImageUploadService = {
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  getImageInfo: jest.fn(),
  getSupportedImageTypes: jest.fn(),
  getMaxImageSize: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const makeFile = (name = 'photo.jpg', size = 1024) =>
  ({ originalname: name, filename: name, mimetype: 'image/jpeg', size, path: `/tmp/${name}` }) as Express.Multer.File;

const uploadResult = { filename: 'photo.jpg', path: '/uploads/photo.jpg', url: '/uploads/photo.jpg', size: 1024, mimetype: 'image/jpeg' };

describe('UploadFacadeService', () => {
  let service: UploadFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockImageUploadService.getSupportedImageTypes.mockReturnValue(['.jpg', '.png', '.webp']);
    mockImageUploadService.getMaxImageSize.mockReturnValue(5 * 1024 * 1024);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadFacadeService,
        { provide: Logger, useValue: mockLogger },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: ImageUploadService, useValue: mockImageUploadService },
      ],
    }).compile();

    service = module.get<UploadFacadeService>(UploadFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── uploadImage ──────────────────────────────────────────────────────────────

  describe('uploadImage()', () => {
    it('delegates to ImageUploadService', async () => {
      mockImageUploadService.uploadImage.mockResolvedValue(uploadResult);

      const result = await service.uploadImage({ file: makeFile() });

      expect(result.url).toBe('/uploads/photo.jpg');
      expect(mockImageUploadService.uploadImage).toHaveBeenCalled();
    });

    it('wraps and re-throws on error', async () => {
      mockImageUploadService.uploadImage.mockRejectedValue(new Error('disk full'));

      await expect(service.uploadImage({ file: makeFile() })).rejects.toThrow('Failed to upload image');
    });
  });

  // ─── deleteImage ──────────────────────────────────────────────────────────────

  describe('deleteImage()', () => {
    it('returns success message on successful deletion', async () => {
      mockImageUploadService.deleteImage.mockResolvedValue({ success: true });

      const result = await service.deleteImage('', 'photo.jpg');

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });

    it('wraps and re-throws on error', async () => {
      mockImageUploadService.deleteImage.mockRejectedValue(new Error('not found'));

      await expect(service.deleteImage('', 'photo.jpg')).rejects.toThrow('Failed to delete image');
    });
  });

  // ─── uploadFile ───────────────────────────────────────────────────────────────

  describe('uploadFile()', () => {
    it('delegates to FileUploadService', async () => {
      mockFileUploadService.uploadFile.mockResolvedValue(uploadResult);

      const result = await service.uploadFile({ file: makeFile() });

      expect(result.url).toBe('/uploads/photo.jpg');
    });

    it('wraps and re-throws on error', async () => {
      mockFileUploadService.uploadFile.mockRejectedValue(new Error('quota exceeded'));

      await expect(service.uploadFile({ file: makeFile() })).rejects.toThrow('Failed to upload file');
    });
  });

  // ─── deleteFile ───────────────────────────────────────────────────────────────

  describe('deleteFile()', () => {
    it('returns success message', async () => {
      mockFileUploadService.deleteFile.mockResolvedValue({ success: true });

      const result = await service.deleteFile('', 'doc.pdf');

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });
  });

  // ─── validateImageFile ────────────────────────────────────────────────────────

  describe('validateImageFile()', () => {
    it('returns valid=true for a good image file', async () => {
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(true);

      const result = await service.validateImageFile(makeFile());

      expect(result.valid).toBe(true);
    });

    it('returns valid=false when no file provided', async () => {
      const result = await service.validateImageFile(null as any);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('No file provided');
    });

    it('returns valid=false for unsupported file type', async () => {
      mockFileUploadService.validateFileType.mockResolvedValue(false);

      const result = await service.validateImageFile(makeFile('doc.exe'));

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('returns valid=false when file exceeds size limit', async () => {
      mockFileUploadService.validateFileType.mockResolvedValue(true);
      mockFileUploadService.validateFileSize.mockResolvedValue(false);

      const result = await service.validateImageFile(makeFile('big.jpg', 100 * 1024 * 1024));

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });

  // ─── utility methods ──────────────────────────────────────────────────────────

  describe('getSupportedImageTypes()', () => {
    it('delegates to ImageUploadService', () => {
      const types = service.getSupportedImageTypes();

      expect(types).toContain('.jpg');
      expect(mockImageUploadService.getSupportedImageTypes).toHaveBeenCalled();
    });
  });

  describe('getMaxImageSize()', () => {
    it('delegates to ImageUploadService', () => {
      expect(service.getMaxImageSize()).toBe(5 * 1024 * 1024);
    });
  });
});
