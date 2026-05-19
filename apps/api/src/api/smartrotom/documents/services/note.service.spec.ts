import { Test, TestingModule } from '@nestjs/testing';
import { NoteService } from './note.service';
import { DOCUMENTS_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';

const mockRepo = {
  findDocumentById: jest.fn(),
  findDocumentUserAssociation: jest.fn(),
  addDocumentToUser: jest.fn(),
  removeDocumentFromUser: jest.fn(),
};

const mockDoc = { id: 1, title: 'Note', content: 'body' } as any;
const UUID = 'player-uuid';

describe('NoteService', () => {
  let service: NoteService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: DOCUMENTS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── addNoteToUser ────────────────────────────────────────────────────────────

  describe('addNoteToUser()', () => {
    it('adds note when document exists and no association yet', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDoc);
      mockRepo.findDocumentUserAssociation.mockResolvedValue(null);
      mockRepo.addDocumentToUser.mockResolvedValue(undefined);

      const result = await service.addNoteToUser(1, UUID);

      expect(result.success).toBe(true);
      expect(mockRepo.addDocumentToUser).toHaveBeenCalledWith(1, UUID);
    });

    it('returns success without re-adding when association already exists', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDoc);
      mockRepo.findDocumentUserAssociation.mockResolvedValue({ id: 10 });

      const result = await service.addNoteToUser(1, UUID);

      expect(result.success).toBe(true);
      expect(mockRepo.addDocumentToUser).not.toHaveBeenCalled();
    });

    it('throws when documentId is 0', async () => {
      await expect(service.addNoteToUser(0, UUID)).rejects.toThrow(
        'Valid document ID is required',
      );
    });

    it('throws when uuid is empty', async () => {
      await expect(service.addNoteToUser(1, '')).rejects.toThrow(
        'UUID is required',
      );
    });

    it('throws when document does not exist', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(service.addNoteToUser(99, UUID)).rejects.toThrow(
        'Document not found',
      );
    });
  });

  // ─── removeNoteFromUser ───────────────────────────────────────────────────────

  describe('removeNoteFromUser()', () => {
    it('removes note when association exists', async () => {
      mockRepo.findDocumentUserAssociation.mockResolvedValue({ id: 5 });
      mockRepo.removeDocumentFromUser.mockResolvedValue(undefined);

      const result = await service.removeNoteFromUser(1, UUID);

      expect(result.success).toBe(true);
      expect(mockRepo.removeDocumentFromUser).toHaveBeenCalledWith(1, UUID);
    });

    it('throws when association does not exist', async () => {
      mockRepo.findDocumentUserAssociation.mockResolvedValue(null);

      await expect(service.removeNoteFromUser(1, UUID)).rejects.toThrow(
        'User is not associated with this document',
      );
    });

    it('throws when documentId is 0', async () => {
      await expect(service.removeNoteFromUser(0, UUID)).rejects.toThrow(
        'Valid document ID is required',
      );
    });

    it('throws when uuid is empty', async () => {
      await expect(service.removeNoteFromUser(1, '')).rejects.toThrow(
        'UUID is required',
      );
    });
  });

  // ─── validateUserHasAccess ────────────────────────────────────────────────────

  describe('validateUserHasAccess()', () => {
    it('returns true when association exists', async () => {
      mockRepo.findDocumentUserAssociation.mockResolvedValue({ id: 3 });

      await expect(service.validateUserHasAccess(1, UUID)).resolves.toBe(true);
    });

    it('returns false when no association', async () => {
      mockRepo.findDocumentUserAssociation.mockResolvedValue(null);

      await expect(service.validateUserHasAccess(1, UUID)).resolves.toBe(false);
    });
  });
});
