import {
  RotomDocument,
  RotomUserDocument,
} from '@/_db/schema/SmartRotomDocuments';
import { DocumentShare, NotePreview } from '../documents.repository';

export interface DocumentMutation {
  title?: string;
  content?: string;
  type?: number;
  public?: boolean;
  pinned?: boolean;
  folderId?: number | null;
}

export interface IDocumentsRepository {
  findDocumentById(id: number): Promise<RotomDocument | null>;
  findUserDocuments(uuid: string): Promise<NotePreview[]>;
  findTrashedDocuments(uuid: string): Promise<NotePreview[]>;
  createDocument(documentData: {
    title: string;
    content: string;
    type: number;
    public?: boolean;
  }): Promise<{ insertId: number }>;
  updateDocument(id: number, documentData: DocumentMutation): Promise<void>;
  softDeleteDocument(id: number): Promise<void>;
  restoreDocument(id: number): Promise<void>;
  deleteDocument(id: number): Promise<void>;

  findDocumentUserAssociation(
    documentId: number,
    uuid: string,
  ): Promise<RotomUserDocument | null>;
  findDocumentShares(documentId: number): Promise<DocumentShare[]>;
  findSharesByDocumentIds(ids: number[]): Promise<DocumentShare[]>;
  addDocumentToUser(
    documentId: number,
    uuid: string,
  ): Promise<{ insertId: number }>;
  removeDocumentFromUser(documentId: number, uuid: string): Promise<void>;
}
