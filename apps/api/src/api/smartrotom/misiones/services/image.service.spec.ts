import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from './image.service';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn(),
  },
}));

import { promises as fsMock } from 'fs';

const PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgo=';

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fsMock.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fsMock.writeFile as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageService],
    }).compile();

    service = module.get<ImageService>(ImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── uploadCustomNPCImage ─────────────────────────────────────────────────────

  describe('uploadCustomNPCImage()', () => {
    it('writes file and returns OK status', async () => {
      const result = await service.uploadCustomNPCImage({
        npcName: 'Oak',
        image: PNG_BASE64,
      });

      expect(result.status).toBe('OK');
      expect(fsMock.writeFile).toHaveBeenCalled();
    });

    it('sanitizes npcName in the filepath', async () => {
      await service.uploadCustomNPCImage({ npcName: 'NPC Brock!', image: PNG_BASE64 });

      const writePath = (fsMock.writeFile as jest.Mock).mock.calls[0][0] as string;
      expect(writePath).toContain('npc_brock');
      expect(writePath).not.toContain(' ');
      expect(writePath).not.toContain('!');
    });

    it('returns ERROR status when npcName is missing', async () => {
      const result = await service.uploadCustomNPCImage({ npcName: '', image: PNG_BASE64 });

      expect(result.status).toBe('ERROR');
      expect(fsMock.writeFile).not.toHaveBeenCalled();
    });

    it('returns ERROR status when image format is not PNG base64', async () => {
      const result = await service.uploadCustomNPCImage({
        npcName: 'Oak',
        image: 'data:image/jpeg;base64,/9j/4AA',
      });

      expect(result.status).toBe('ERROR');
      expect(result.error).toContain('base64 encoded PNG');
    });

    it('returns ERROR status when writeFile fails', async () => {
      (fsMock.writeFile as jest.Mock).mockRejectedValue(new Error('disk full'));

      const result = await service.uploadCustomNPCImage({ npcName: 'Oak', image: PNG_BASE64 });

      expect(result.status).toBe('ERROR');
      expect(result.error).toContain('disk full');
    });
  });

  // ─── checkCustomNPCRenderExists ───────────────────────────────────────────────

  describe('checkCustomNPCRenderExists()', () => {
    it('returns exists=true when file is accessible', async () => {
      (fsMock.access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.checkCustomNPCRenderExists('Oak');

      expect(result.exists).toBe(true);
      expect(result.path).toContain('oak.png');
    });

    it('returns exists=false when file is not accessible', async () => {
      (fsMock.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      const result = await service.checkCustomNPCRenderExists('Oak');

      expect(result.exists).toBe(false);
    });
  });

  // ─── checkCustomNPCImageExists ────────────────────────────────────────────────

  describe('checkCustomNPCImageExists()', () => {
    it('returns exists=true when image file is accessible', async () => {
      (fsMock.access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.checkCustomNPCImageExists('Misty');

      expect(result.exists).toBe(true);
    });

    it('returns exists=false when image file is not accessible', async () => {
      (fsMock.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      const result = await service.checkCustomNPCImageExists('Misty');

      expect(result.exists).toBe(false);
    });
  });
});
