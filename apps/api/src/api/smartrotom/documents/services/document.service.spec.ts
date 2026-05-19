import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { DOCUMENTS_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';

const mockRepo = {
  findDocumentById: jest.fn(),
  findUserDocuments: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
};

const mockDocument = {
  id: 1,
  title: 'Notes',
  content: 'Hello',
  type: 1,
  public: 0,
} as any;

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { provide: DOCUMENTS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getDocumentById ──────────────────────────────────────────────────────────

  describe('getDocumentById()', () => {
    it('returns the document when found', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      await expect(service.getDocumentById(1)).resolves.toEqual(mockDocument);
      expect(mockRepo.findDocumentById).toHaveBeenCalledWith(1);
    });

    it('throws when id is 0', async () => {
      await expect(service.getDocumentById(0)).rejects.toThrow(
        'Valid document ID is required',
      );
      expect(mockRepo.findDocumentById).not.toHaveBeenCalled();
    });

    it('throws when document not found', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(service.getDocumentById(99)).rejects.toThrow(
        'Document not found',
      );
    });
  });

  // ─── getUserDocuments ─────────────────────────────────────────────────────────

  describe('getUserDocuments()', () => {
    it('returns user documents from repo', async () => {
      const docs = [mockDocument];
      mockRepo.findUserDocuments.mockResolvedValue(docs);

      await expect(service.getUserDocuments('user-uuid')).resolves.toEqual(
        docs,
      );
      expect(mockRepo.findUserDocuments).toHaveBeenCalledWith('user-uuid');
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getUserDocuments('')).rejects.toThrow(
        'UUID is required',
      );
    });
  });

  // ─── createDocument ───────────────────────────────────────────────────────────

  describe('createDocument()', () => {
    it('creates document and returns it by insertId', async () => {
      mockRepo.createDocument.mockResolvedValue({ insertId: 1 });
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      const result = await service.createDocument({
        title: 'Notes',
        content: 'Hello',
        type: 1,
      });

      expect(result).toEqual(mockDocument);
      expect(mockRepo.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Notes',
          content: 'Hello',
          type: 1,
          public: 0,
        }),
      );
    });

    it('defaults public to 0 when not provided', async () => {
      mockRepo.createDocument.mockResolvedValue({ insertId: 1 });
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      await service.createDocument({ title: 'T', content: 'C', type: 2 });

      expect(mockRepo.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ public: 0 }),
      );
    });

    it('throws when title is missing', async () => {
      await expect(
        service.createDocument({ title: '', content: 'Hello', type: 1 }),
      ).rejects.toThrow('Title and content are required');
    });

    it('throws when content is missing', async () => {
      await expect(
        service.createDocument({ title: 'Notes', content: '', type: 1 }),
      ).rejects.toThrow('Title and content are required');
    });

    it('throws when type is not provided', async () => {
      await expect(
        service.createDocument({
          title: 'Notes',
          content: 'Hello',
          type: undefined as any,
        }),
      ).rejects.toThrow('Document type is required');
    });
  });

  // ─── updateDocument ───────────────────────────────────────────────────────────

  describe('updateDocument()', () => {
    it('updates existing document', async () => {
      mockRepo.findDocumentById.mockResolvedValueOnce(mockDocument);
      mockRepo.updateDocument.mockResolvedValue(undefined);
      mockRepo.findDocumentById.mockResolvedValueOnce({
        ...mockDocument,
        title: 'Updated',
      });

      const result = await service.updateDocument(1, { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(mockRepo.updateDocument).toHaveBeenCalledWith(1, {
        title: 'Updated',
      });
    });

    it('throws when document not found', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(service.updateDocument(99, { title: 'X' })).rejects.toThrow(
        'Document not found',
      );
    });
  });

  // ─── deleteDocument ───────────────────────────────────────────────────────────

  describe('deleteDocument()', () => {
    it('deletes existing document', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);
      mockRepo.deleteDocument.mockResolvedValue(undefined);

      await expect(service.deleteDocument(1)).resolves.toBeUndefined();
      expect(mockRepo.deleteDocument).toHaveBeenCalledWith(1);
    });

    it('throws when document not found', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(service.deleteDocument(99)).rejects.toThrow(
        'Document not found',
      );
      expect(mockRepo.deleteDocument).not.toHaveBeenCalled();
    });
  });

  // ─── saveDocument ─────────────────────────────────────────────────────────────

  describe('saveDocument()', () => {
    it('creates new document when id is 0', async () => {
      mockRepo.createDocument.mockResolvedValue({ insertId: 5 });
      mockRepo.findDocumentById.mockResolvedValue({ ...mockDocument, id: 5 });

      const result = await service.saveDocument(0, 'New', 'Body', 1);

      expect(result.success).toBe(true);
      expect(result.id).toBe(5);
    });

    it('updates existing document when id > 0', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);
      mockRepo.updateDocument.mockResolvedValue(undefined);
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      const result = await service.saveDocument(1, 'Notes', 'Hello', 1);

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
    });
  });

  // ─── validateDocumentExists ───────────────────────────────────────────────────

  describe('validateDocumentExists()', () => {
    it('returns true when document exists', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      await expect(service.validateDocumentExists(1)).resolves.toBe(true);
    });

    it('returns false when document does not exist', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(service.validateDocumentExists(99)).resolves.toBe(false);
    });
  });
});
