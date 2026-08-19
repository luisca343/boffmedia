import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { DOCUMENTS_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';

const OWNER = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const STRANGER = '11111111-2222-3333-4444-555555555555';

const mockRepo = {
  findDocumentById: jest.fn(),
  findUserDocuments: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  softDeleteDocument: jest.fn(),
  // Ownership is proven through the join table, so every mutating test needs it.
  findDocumentUserAssociation: jest.fn(),
  addDocumentToUser: jest.fn(),
  deleteDocument: jest.fn(),
  restoreDocument: jest.fn(),
};

const mockDocument = {
  id: 1,
  title: 'Notes',
  content: 'Hello',
  type: 1,
  public: false,
} as any;

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Default: the caller holds the document. Tests that check the 403 path
    // override this.
    mockRepo.findDocumentUserAssociation.mockResolvedValue({
      documentId: 1,
      uuid: OWNER,
    });
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

      await expect(service.getDocumentById(1, OWNER)).resolves.toEqual(
        mockDocument,
      );
      expect(mockRepo.findDocumentById).toHaveBeenCalledWith(1);
    });

    it('throws when id is 0', async () => {
      await expect(service.getDocumentById(0, OWNER)).rejects.toThrow(
        'Identificador de nota inválido',
      );
      expect(mockRepo.findDocumentById).not.toHaveBeenCalled();
    });

    it('throws when document not found', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(service.getDocumentById(99, OWNER)).rejects.toThrow(
        'Nota no encontrada',
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

    it('lists nothing for an owner with no notes', async () => {
      mockRepo.findUserDocuments.mockResolvedValue([]);

      await expect(service.getUserDocuments(OWNER)).resolves.toEqual([]);
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
          public: false,
        }),
      );
    });

    it('defaults public to false when not provided', async () => {
      mockRepo.createDocument.mockResolvedValue({ insertId: 1 });
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      await service.createDocument({ title: 'T', content: 'C', type: 2 });

      expect(mockRepo.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ public: false }),
      );
    });

    it('throws when title is missing', async () => {
      await expect(
        service.createDocument({ title: '', content: 'Hello', type: 1 }),
      ).rejects.toThrow('Título y contenido son obligatorios');
    });

    it('throws when content is missing', async () => {
      await expect(
        service.createDocument({ title: 'Notes', content: '', type: 1 }),
      ).rejects.toThrow('Título y contenido son obligatorios');
    });

    it('throws when type is not provided', async () => {
      await expect(
        service.createDocument({
          title: 'Notes',
          content: 'Hello',
          type: undefined as any,
        }),
      ).rejects.toThrow('El tipo de nota es obligatorio');
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

      const result = await service.updateDocument(1, OWNER, {
        title: 'Updated',
      });

      expect(result.title).toBe('Updated');
      expect(mockRepo.updateDocument).toHaveBeenCalledWith(1, {
        title: 'Updated',
      });
    });

    it('throws when document not found', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(
        service.updateDocument(99, OWNER, { title: 'X' }),
      ).rejects.toThrow('Nota no encontrada');
    });
  });

  // ─── deleteDocument ───────────────────────────────────────────────────────────

  describe('deleteDocument()', () => {
    it('soft-deletes existing document', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);
      mockRepo.softDeleteDocument.mockResolvedValue(undefined);

      await expect(service.deleteDocument(1, OWNER)).resolves.toBeUndefined();
      expect(mockRepo.softDeleteDocument).toHaveBeenCalledWith(1);
    });

    it('throws when document not found', async () => {
      mockRepo.findDocumentById.mockResolvedValue(null);

      await expect(service.deleteDocument(99, OWNER)).rejects.toThrow(
        'Nota no encontrada',
      );
      expect(mockRepo.softDeleteDocument).not.toHaveBeenCalled();
    });
  });

  // ─── saveDocument ─────────────────────────────────────────────────────────────

  describe('saveDocument()', () => {
    it('creates new document when id is 0', async () => {
      mockRepo.createDocument.mockResolvedValue({ insertId: 5 });
      mockRepo.findDocumentById.mockResolvedValue({ ...mockDocument, id: 5 });

      const result = await service.saveDocument(0, OWNER, 'New', 'Body', 1);

      expect(result.success).toBe(true);
      expect(result.id).toBe(5);
    });

    it('updates existing document when id > 0', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);
      mockRepo.updateDocument.mockResolvedValue(undefined);
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      const result = await service.saveDocument(1, OWNER, 'Notes', 'Hello', 1);

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
    });
  });

  // ─── ownership ────────────────────────────────────────────────────────────────

  describe('ownership', () => {
    it('refuses to update a document the caller does not hold', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);
      mockRepo.findDocumentUserAssociation.mockResolvedValue(null);

      await expect(
        service.updateDocument(1, STRANGER, { title: 'pwned' }),
      ).rejects.toThrow('Esta nota no te pertenece');
      expect(mockRepo.updateDocument).not.toHaveBeenCalled();
    });

    it('refuses to purge a document the caller does not hold', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);
      mockRepo.findDocumentUserAssociation.mockResolvedValue(null);

      await expect(service.purgeDocument(1, STRANGER)).rejects.toThrow(
        'Esta nota no te pertenece',
      );
      expect(mockRepo.deleteDocument).not.toHaveBeenCalled();
    });

    it('serves a public document to a caller who does not hold it', async () => {
      mockRepo.findDocumentById.mockResolvedValue({
        ...mockDocument,
        public: true,
      });
      mockRepo.findDocumentUserAssociation.mockResolvedValue(null);

      await expect(service.getDocumentById(1, STRANGER)).resolves.toMatchObject(
        { id: 1 },
      );
    });

    it('refuses an anonymous read of a private document', async () => {
      mockRepo.findDocumentById.mockResolvedValue(mockDocument);

      await expect(service.getDocumentById(1)).rejects.toThrow(
        'Esta nota es privada',
      );
    });
  });
});
