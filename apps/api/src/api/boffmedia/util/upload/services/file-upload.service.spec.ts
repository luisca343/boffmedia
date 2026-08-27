import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { UploadRepository } from '@repositories/boffmedia/upload.repository';
import { UploadsRepository } from '@repositories/boffmedia/uploads.repository';
import { AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { uploadsPath } from '@/config/paths';

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

const mockUploadsRepo = {
  registerUpload: jest.fn(),
  findByLocation: jest.fn(),
  markDeleted: jest.fn(),
};

const makeFile = (
  name = 'photo.png',
  size = 1024,
  mimetype = 'image/png',
  hasPath = true,
) => {
  const file: any = {
    originalname: name,
    filename: name,
    mimetype,
    size,
  };
  if (hasPath) {
    file.path = `/tmp/${name}`;
  } else {
    file.buffer = Buffer.alloc(size);
  }
  return file as Express.Multer.File;
};

const makeActor = (
  userId = 1,
  roles: string[] = [],
): AuthPrincipal => ({
  userId,
  username: `user${userId}`,
  roles,
});

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.validateFilename.mockReturnValue(true);
    mockRepo.getUploadDirectory.mockResolvedValue('/uploads');
    mockRepo.constructUrlPath.mockReturnValue('/uploads/photo.png');
    mockUploadsRepo.registerUpload.mockResolvedValue({
      id: 1,
      ownerUserId: 1,
      subdir: '',
      filename: 'photo.png',
      mimetype: 'image/png',
      size: 1024,
      createdAt: new Date(),
      deletedAt: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        { provide: UploadRepository, useValue: mockRepo },
        { provide: UploadsRepository, useValue: mockUploadsRepo },
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
      const actor = makeActor();
      mockRepo.saveFile.mockResolvedValue({
        path: '/uploads/photo.png',
        size: 1024,
      });

      const result = await service.uploadFile({ file, actor });

      expect(result.url).toBe('/uploads/photo.png');
      expect(result.filename).toBe('photo.png');
      expect(result.mimetype).toBe('image/png');
      expect(result.size).toBe(1024);
      expect(mockRepo.saveFile).toHaveBeenCalledWith(
        '/tmp/photo.png',
        '/uploads',
        'photo.png',
      );
      expect(mockUploadsRepo.registerUpload).toHaveBeenCalledWith(
        1,
        '',
        'photo.png',
        'image/png',
        1024,
      );
    });

    it('uses custom filename when provided', async () => {
      const file = makeFile('original.png');
      const actor = makeActor();
      mockRepo.saveFile.mockResolvedValue({
        path: '/uploads/custom.png',
        size: 1024,
      });
      mockRepo.constructUrlPath.mockReturnValue('/uploads/custom.png');

      const result = await service.uploadFile({
        file,
        filename: 'custom.png',
        actor,
      });

      expect(result.filename).toBe('custom.png');
    });

    it('generates unique filename when file has no filename or custom override', async () => {
      const file = { ...makeFile(), filename: undefined } as any;
      const actor = makeActor();
      mockRepo.generateUniqueFilename.mockReturnValue('unique-123.png');
      mockRepo.saveFile.mockResolvedValue({
        path: '/uploads/unique-123.png',
        size: 512,
      });

      await service.uploadFile({ file, actor });

      expect(mockRepo.generateUniqueFilename).toHaveBeenCalledWith('photo.png');
    });

    it('throws when no file is provided', async () => {
      const actor = makeActor();
      await expect(
        service.uploadFile({ file: null as any, actor }),
      ).rejects.toThrow('No file provided');
    });

    it('throws when no actor is provided', async () => {
      const file = makeFile();
      await expect(service.uploadFile({ file, actor: null as any })).rejects.toThrow(
        'Actor is required',
      );
    });

    // Filename validation is no longer a repository method the caller may skip
    // or mock away: it is a pure guard in ../safe-path applied on every path
    // into the filesystem. These cases are the traversal that used to escape
    // the uploads root.
    it.each([
      '../evil.png',
      '../../../public/evil.html',
      'nested/evil.png',
      '..\evil.png',
    ])('refuses a traversing filename (%s)', async (filename) => {
      const actor = makeActor();
      await expect(
        service.uploadFile({ file: makeFile(), filename, actor }),
      ).rejects.toThrow('Invalid filename');
    });

    it.each(['../secrets', '/etc', 'Profiles', 'a/../../b'])(
      'refuses a traversing or non-conforming path (%s)',
      async (path) => {
        const actor = makeActor();
        await expect(
          service.uploadFile({ file: makeFile(), path, actor }),
        ).rejects.toThrow('Invalid upload path');
      },
    );

    it('accepts the shapes the web actually sends', async () => {
      const actor = makeActor();
      mockRepo.saveFile.mockResolvedValue({ path: '/uploads', size: 10 });

      await expect(
        service.uploadFile({
          file: makeFile(),
          path: 'profiles/covers',
          filename: '42-cover-1712345678901.jpg',
          actor,
        }),
      ).resolves.toMatchObject({ filename: '42-cover-1712345678901.jpg' });
    });

    // The buffer branch is what the desktop pack-image route uses
    // (memoryStorage, so `file.path` is undefined); it was completely broken
    // before — `fs.rename(undefined, ...)`. The two filesystem calls are stubbed
    // rather than exercised: `var/uploads` is a symlink into a dev-machine path,
    // so touching it makes this unit test depend on local layout. What matters
    // here is that the buffer branch runs, writes to a contained path, and
    // registers ownership.
    it('uploads file from buffer when file.path is undefined', async () => {
      const dir = uploadsPath('packs');
      mockRepo.getUploadDirectory.mockResolvedValue(dir);
      const write = jest
        .spyOn(fsPromises, 'writeFile')
        .mockResolvedValue(undefined);
      const stat = jest
        .spyOn(fsPromises, 'stat')
        .mockResolvedValue({ size: 1024 } as never);

      try {
        const file = makeFile('photo.png', 1024, 'image/png', false);

        const result = await service.uploadFile({ file, actor: makeActor() });

        expect(result.filename).toBe('photo.png');
        expect(mockRepo.saveFile).not.toHaveBeenCalled();
        expect(write).toHaveBeenCalledWith(
          join(dir, 'photo.png'),
          file.buffer,
        );
        expect(mockUploadsRepo.registerUpload).toHaveBeenCalledWith(
          1,
          '',
          'photo.png',
          'image/png',
          1024,
        );
      } finally {
        write.mockRestore();
        stat.mockRestore();
      }
    });

    it('deletes file on disk if registration fails', async () => {
      const file = makeFile();
      const actor = makeActor();
      mockRepo.saveFile.mockResolvedValue({
        path: '/uploads/photo.png',
        size: 1024,
      });
      mockUploadsRepo.registerUpload.mockRejectedValue(
        new Error('Duplicate location'),
      );

      await expect(
        service.uploadFile({ file, actor }),
      ).rejects.toThrow('Duplicate location');

      expect(mockRepo.deleteFile).toHaveBeenCalledWith('/uploads/photo.png');
    });
  });

  // ─── deleteFile ───────────────────────────────────────────────────────────────

  describe('deleteFile()', () => {
    // deleteFile used to join an unvalidated filename onto the upload
    // directory, so this input deleted any file the process could reach.
    it('refuses a traversing filename instead of deleting outside the root', async () => {
      const actor = makeActor();
      mockRepo.fileExists.mockResolvedValue(true);

      await expect(
        service.deleteFile('', '../../../important.db', actor),
      ).rejects.toThrow('Invalid filename');
      expect(mockRepo.deleteFile).not.toHaveBeenCalled();
    });

    it('throws when actor is not provided', async () => {
      mockRepo.fileExists.mockResolvedValue(true);

      await expect(
        service.deleteFile('', 'photo.png', null as any),
      ).rejects.toThrow('Actor is required');
    });

    it('deletes existing file and returns success when owner', async () => {
      const actor = makeActor(1);
      mockRepo.fileExists.mockResolvedValue(true);
      mockUploadsRepo.findByLocation.mockResolvedValue({
        id: 1,
        ownerUserId: 1,
        subdir: '',
        filename: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
        createdAt: new Date(),
        deletedAt: null,
      });

      const result = await service.deleteFile('', 'photo.png', actor);

      expect(result.success).toBe(true);
      expect(mockRepo.deleteFile).toHaveBeenCalled();
      expect(mockUploadsRepo.markDeleted).toHaveBeenCalledWith(1);
    });

    it('deletes legacy file when actor is admin', async () => {
      const actor = makeActor(2, [USER_ROLES.BOFF_ADMIN]);
      mockRepo.fileExists.mockResolvedValue(true);
      mockUploadsRepo.findByLocation.mockResolvedValue(null); // Legacy file

      const result = await service.deleteFile('', 'photo.png', actor);

      expect(result.success).toBe(true);
      expect(mockRepo.deleteFile).toHaveBeenCalled();
    });

    it('rejects non-owner who tries to delete owned file', async () => {
      const actor = makeActor(2);
      mockRepo.fileExists.mockResolvedValue(true);
      mockUploadsRepo.findByLocation.mockResolvedValue({
        id: 1,
        ownerUserId: 1, // Different user
        subdir: '',
        filename: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
        createdAt: new Date(),
        deletedAt: null,
      });

      await expect(service.deleteFile('', 'photo.png', actor)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRepo.deleteFile).not.toHaveBeenCalled();
    });

    it('rejects non-admin who tries to delete legacy file', async () => {
      const actor = makeActor(1);
      mockRepo.fileExists.mockResolvedValue(true);
      mockUploadsRepo.findByLocation.mockResolvedValue(null); // Legacy file

      await expect(service.deleteFile('', 'photo.png', actor)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRepo.deleteFile).not.toHaveBeenCalled();
    });

    it('allows admin to delete non-owned file', async () => {
      const actor = makeActor(2, [USER_ROLES.BOFF_ADMIN]);
      mockRepo.fileExists.mockResolvedValue(true);
      mockUploadsRepo.findByLocation.mockResolvedValue({
        id: 1,
        ownerUserId: 1, // Different user
        subdir: '',
        filename: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
        createdAt: new Date(),
        deletedAt: null,
      });

      const result = await service.deleteFile('', 'photo.png', actor);

      expect(result.success).toBe(true);
      expect(mockRepo.deleteFile).toHaveBeenCalled();
    });

    it('throws when filename is empty', async () => {
      const actor = makeActor();
      await expect(service.deleteFile('', '', actor)).rejects.toThrow(
        'Filename is required',
      );
    });

    it('throws when file does not exist', async () => {
      const actor = makeActor();
      mockRepo.fileExists.mockResolvedValue(false);

      await expect(service.deleteFile('', 'ghost.png', actor)).rejects.toThrow(
        'File not found',
      );
    });
  });

  // ─── getFileInfo ──────────────────────────────────────────────────────────────

  describe('getFileInfo()', () => {
    it('returns file info when file exists and actor is owner', async () => {
      const actor = makeActor(1);
      mockRepo.fileExists.mockResolvedValue(true);
      mockRepo.getFileInfo.mockResolvedValue({
        size: 2048,
        createdAt: new Date('2026-01-01'),
      });
      mockUploadsRepo.findByLocation.mockResolvedValue({
        id: 1,
        ownerUserId: 1,
        subdir: '',
        filename: 'photo.png',
        mimetype: 'image/png',
        size: 2048,
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      const result = await service.getFileInfo('', 'photo.png', actor);

      expect(result.exists).toBe(true);
      expect(result.size).toBe(2048);
    });

    it('returns legacy file info when actor is admin', async () => {
      const actor = makeActor(1, [USER_ROLES.BOFF_ADMIN]);
      mockRepo.fileExists.mockResolvedValue(true);
      mockRepo.getFileInfo.mockResolvedValue({
        size: 2048,
        createdAt: new Date('2026-01-01'),
      });
      mockUploadsRepo.findByLocation.mockResolvedValue(null); // Legacy file

      const result = await service.getFileInfo('', 'photo.png', actor);

      expect(result.exists).toBe(true);
      expect(result.size).toBe(2048);
    });

    it('throws when actor is not provided', async () => {
      mockRepo.fileExists.mockResolvedValue(true);

      await expect(
        service.getFileInfo('', 'photo.png', null as any),
      ).rejects.toThrow('Actor is required');
    });

    it('rejects non-owner who tries to access owned file', async () => {
      const actor = makeActor(2);
      mockRepo.fileExists.mockResolvedValue(true);
      mockUploadsRepo.findByLocation.mockResolvedValue({
        id: 1,
        ownerUserId: 1, // Different user
        subdir: '',
        filename: 'photo.png',
        mimetype: 'image/png',
        size: 2048,
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      await expect(
        service.getFileInfo('', 'photo.png', actor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-admin who tries to access legacy file', async () => {
      const actor = makeActor(1);
      mockRepo.fileExists.mockResolvedValue(true);
      mockUploadsRepo.findByLocation.mockResolvedValue(null); // Legacy file

      await expect(
        service.getFileInfo('', 'photo.png', actor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to access non-owned file', async () => {
      const actor = makeActor(2, [USER_ROLES.BOFF_ADMIN]);
      mockRepo.fileExists.mockResolvedValue(true);
      mockRepo.getFileInfo.mockResolvedValue({
        size: 2048,
        createdAt: new Date('2026-01-01'),
      });
      mockUploadsRepo.findByLocation.mockResolvedValue({
        id: 1,
        ownerUserId: 1, // Different user
        subdir: '',
        filename: 'photo.png',
        mimetype: 'image/png',
        size: 2048,
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      const result = await service.getFileInfo('', 'photo.png', actor);

      expect(result.exists).toBe(true);
      expect(result.size).toBe(2048);
    });

    it('returns exists=false when file not found', async () => {
      const actor = makeActor();
      mockRepo.fileExists.mockResolvedValue(false);

      const result = await service.getFileInfo('', 'ghost.png', actor);

      expect(result.exists).toBe(false);
    });

    it('throws when filename is empty', async () => {
      const actor = makeActor();
      await expect(service.getFileInfo('', '', actor)).rejects.toThrow(
        'Filename is required',
      );
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
      await expect(
        service.validateFileType(null as any, ['.png']),
      ).resolves.toBe(false);
    });
  });

  // ─── validateFileSize ─────────────────────────────────────────────────────────

  describe('validateFileSize()', () => {
    it('returns true when file size is within limit', async () => {
      await expect(
        service.validateFileSize(makeFile('f.png', 1024), 2048),
      ).resolves.toBe(true);
    });

    it('returns false when file size exceeds limit', async () => {
      await expect(
        service.validateFileSize(makeFile('f.png', 5000), 2048),
      ).resolves.toBe(false);
    });
  });
});
