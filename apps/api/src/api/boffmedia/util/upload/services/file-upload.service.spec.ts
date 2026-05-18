import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import { UploadRepository } from '@repositories/boffmedia/upload.repository';

const mockRepo = {
  sanitizePath: jest.fn((p) => p),
  validateFilename: jest.fn(),
  getUploadDirectory: jest.fn(),
  saveFile: jest.fn(),
  constructUrlPath: jest.fn(),
  fileExists: jest.fn(),
  deleteFile: jest.fn(),
  getFileInfo: jest.fn(),
  generateUniqueFilename: jest.fn(),
};

const makeFile = (name = 'photo.png', size = 1024, mimetype = 'image/png') =>
  ({
    originalname: name,
    filename: name,
    mimetype,
    size,
    path: `/tmp/${name}`,
  }) as Express.Multer.File;

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.validateFilename.mockReturnValue(true);
    mockRepo.getUploadDirectory.mockResolvedValue('/uploads');
    mockRepo.constructUrlPath.mockReturnValue('/uploads/photo.png');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        { provide: UploadRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── uploadFile ───────────────────────────────────────────────────────────────

  describe('uploadFile()', () => {
    it('saves file and returns response with url and metadata', async () => {
      const file = makeFile();
      mockRepo.saveFile.mockResolvedValue({ path: '/uploads/photo.png', size: 1024 });

      const result = await service.uploadFile({ file });

      expect(result.url).toBe('/uploads/photo.png');
      expect(result.filename).toBe('photo.png');
      expect(result.mimetype).toBe('image/png');
      expect(result.size).toBe(1024);
      expect(mockRepo.saveFile).toHaveBeenCalledWith('/tmp/photo.png', '/uploads', 'photo.png');
    });

    it('uses custom filename when provided', async () => {
      const file = makeFile('original.png');
      mockRepo.saveFile.mockResolvedValue({ path: '/uploads/custom.png', size: 1024 });
      mockRepo.constructUrlPath.mockReturnValue('/uploads/custom.png');

      const result = await service.uploadFile({ file, filename: 'custom.png' });

      expect(result.filename).toBe('custom.png');
    });

    it('generates unique filename when file has no filename or custom override', async () => {
      const file = { ...makeFile(), filename: undefined } as any;
      mockRepo.generateUniqueFilename.mockReturnValue('unique-123.png');
      mockRepo.saveFile.mockResolvedValue({ path: '/uploads/unique-123.png', size: 512 });

      await service.uploadFile({ file });

      expect(mockRepo.generateUniqueFilename).toHaveBeenCalledWith('photo.png');
    });

    it('throws when no file is provided', async () => {
      await expect(service.uploadFile({ file: null as any })).rejects.toThrow('No file provided');
    });

    it('throws when filename is invalid', async () => {
      mockRepo.validateFilename.mockReturnValue(false);

      await expect(service.uploadFile({ file: makeFile() })).rejects.toThrow('Invalid filename');
    });
  });

  // ─── deleteFile ───────────────────────────────────────────────────────────────

  describe('deleteFile()', () => {
    it('deletes existing file and returns success', async () => {
      mockRepo.fileExists.mockResolvedValue(true);
      mockRepo.deleteFile.mockResolvedValue(undefined);

      await expect(service.deleteFile('', 'photo.png')).resolves.toEqual({ success: true });
      expect(mockRepo.deleteFile).toHaveBeenCalled();
    });

    it('throws when filename is empty', async () => {
      await expect(service.deleteFile('', '')).rejects.toThrow('Filename is required');
    });

    it('throws when file does not exist', async () => {
      mockRepo.fileExists.mockResolvedValue(false);

      await expect(service.deleteFile('', 'ghost.png')).rejects.toThrow('File not found');
    });
  });

  // ─── getFileInfo ──────────────────────────────────────────────────────────────

  describe('getFileInfo()', () => {
    it('returns file info when file exists', async () => {
      mockRepo.fileExists.mockResolvedValue(true);
      mockRepo.getFileInfo.mockResolvedValue({ size: 2048, createdAt: new Date('2026-01-01') });

      const result = await service.getFileInfo('', 'photo.png');

      expect(result.exists).toBe(true);
      expect(result.size).toBe(2048);
    });

    it('returns exists=false when file not found', async () => {
      mockRepo.fileExists.mockResolvedValue(false);

      const result = await service.getFileInfo('', 'ghost.png');

      expect(result.exists).toBe(false);
    });

    it('throws when filename is empty', async () => {
      await expect(service.getFileInfo('', '')).rejects.toThrow('Filename is required');
    });
  });

  // ─── validateFileType ─────────────────────────────────────────────────────────

  describe('validateFileType()', () => {
    it('returns true when extension matches allowed types', async () => {
      await expect(
        service.validateFileType(makeFile('image.png'), ['.png', '.jpg']),
      ).resolves.toBe(true);
    });

    it('returns false when extension is not allowed', async () => {
      await expect(
        service.validateFileType(makeFile('file.exe'), ['.png', '.jpg']),
      ).resolves.toBe(false);
    });

    it('returns false when file is null', async () => {
      await expect(service.validateFileType(null as any, ['.png'])).resolves.toBe(false);
    });
  });

  // ─── validateFileSize ─────────────────────────────────────────────────────────

  describe('validateFileSize()', () => {
    it('returns true when file size is within limit', async () => {
      await expect(service.validateFileSize(makeFile('f.png', 1024), 2048)).resolves.toBe(true);
    });

    it('returns false when file size exceeds limit', async () => {
      await expect(service.validateFileSize(makeFile('f.png', 5000), 2048)).resolves.toBe(false);
    });
  });
});
