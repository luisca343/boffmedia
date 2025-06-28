import { CreateDocumentDto } from '../../dto/create-document.dto';
import { UpdateDocumentDto } from '../../dto/document.dto';
import { NotePreview, Document } from '../../entities/document.entity';
import { RotomDocumentUser } from '@/_db/schema/SmartRotomDocuments';

export interface IDocumentsRepository {
  findDocumentById(id: number): Promise<Document | null>;
  findUserDocuments(uuid: string): Promise<NotePreview[]>;
  createDocument(documentData: CreateDocumentDto): Promise<{ insertId: number }>;
  updateDocument(id: number, documentData: UpdateDocumentDto): Promise<void>;
  deleteDocument(id: number): Promise<void>;

  findDocumentUserAssociation(documentId: number, uuid: string): Promise<RotomDocumentUser | null>;
  addDocumentToUser(documentId: number, uuid: string): Promise<{ insertId: number }>;
  removeDocumentFromUser(documentId: number, uuid: string): Promise<void>;
}
