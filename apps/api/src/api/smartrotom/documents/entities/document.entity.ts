import { ApiProperty } from '@nestjs/swagger';

export class Document {
  @ApiProperty({
    example: 123,
    description: 'Document ID',
  })
  id: number;
  @ApiProperty({
    example: 'My Important Notes',
    description: 'Document title',
  })
  title: string;

  @ApiProperty({
    example: 'This is the content of my document...',
    description: 'Document content',
  })
  content: string;

  @ApiProperty({
    example: 1,
    description: 'Document type',
  })
  type: number;

  @ApiProperty({
    example: 0,
    description: 'Public flag (0 = private, 1 = public)',
  })
  public: number;

  @ApiProperty({
    example: 0,
    description: 'Pinned flag (0 = no, 1 = pinned)',
  })
  pinned: number;

  @ApiProperty({
    type: Number,
    example: 12,
    description: 'Folder ID the document belongs to, or null',
    nullable: true,
  })
  folderId: number | null;

  @ApiProperty({
    type: String,
    example: null,
    description: 'Soft-delete timestamp; null means live',
    nullable: true,
  })
  deletedAt: Date | null;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'Document creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'Document last update date',
  })
  updatedAt: Date;
}

export class NotePreview {
  @ApiProperty({
    example: 123,
    description: 'Note ID',
  })
  id: number;

  @ApiProperty({
    example: 'My Important Notes',
    description: 'Note title',
  })
  title: string;

  @ApiProperty({
    example: 1,
    description: 'Note type',
  })
  type: number;

  @ApiProperty({
    example: 0,
    description: 'Public flag (0 = private, 1 = public)',
  })
  public: number;

  @ApiProperty({
    example: 0,
    description: 'Pinned flag (0 = no, 1 = pinned)',
  })
  pinned: number;

  @ApiProperty({
    type: Number,
    example: 12,
    description: 'Folder ID the note belongs to, or null',
    nullable: true,
  })
  folderId: number | null;

  @ApiProperty({
    type: [Number],
    example: [4, 7],
    description: 'IDs of tags applied to the note',
  })
  tags: number[];

  @ApiProperty({
    type: [String],
    example: ['67d9b543-5ac9-41e1-a8a5-20d7689e24a4'],
    description: 'UUIDs of users this note is shared with',
  })
  sharedWith: string[];

  @ApiProperty({
    type: String,
    example: null,
    description: 'Soft-delete timestamp; null means live',
    nullable: true,
  })
  deletedAt: Date | null;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'Note creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'Note last update date',
  })
  updatedAt: Date;
}

export class NoteFolder {
  @ApiProperty({ example: 12, description: 'Folder ID' })
  id: number;

  @ApiProperty({ example: 'Equipos Competitivos', description: 'Folder name' })
  name: string;

  @ApiProperty({
    example: 'primary',
    description:
      'Semantic palette key (primary | secondary | accent | success | warning | error | info)',
  })
  color: string;

  @ApiProperty({
    type: Number,
    example: null,
    description: 'Parent folder ID for nesting, or null for a root folder',
    nullable: true,
  })
  parentId: number | null;

  @ApiProperty({ example: '2025-06-14T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-14T12:00:00.000Z' })
  updatedAt: Date;
}

export class NoteTag {
  @ApiProperty({ example: 7, description: 'Tag ID' })
  id: number;

  @ApiProperty({ example: 'meta', description: 'Tag label' })
  label: string;

  @ApiProperty({
    example: 'primary',
    description: 'Semantic palette key',
  })
  color: string;
}

export class NoteVersion {
  @ApiProperty({ example: 45, description: 'Version ID' })
  id: number;

  @ApiProperty({
    example: 123,
    description: 'Document ID this version belongs to',
  })
  documentId: number;

  @ApiProperty({
    type: String,
    example: 'Ajuste de velocidad',
    description: 'Optional human label for the snapshot',
    nullable: true,
  })
  label: string | null;

  @ApiProperty({
    example: '<h1>...</h1>',
    description: 'Full HTML content snapshot',
  })
  content: string;

  @ApiProperty({
    type: String,
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'UUID of the author who produced this snapshot',
    nullable: true,
  })
  authorUuid: string | null;

  @ApiProperty({ example: 96, description: 'Word count at snapshot time' })
  words: number;

  @ApiProperty({ example: '2025-06-14T12:00:00.000Z' })
  createdAt: Date;
}

export class CreateDocumentResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Document created successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    description: 'Created document details',
    type: Document,
  })
  document: Document;
}

export class DocumentResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;
}

export class CreateNoteResponse {
  @ApiProperty({
    example: 123,
    description: 'Created note ID',
  })
  id: number;

  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;
}

export class SaveDocumentResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 123,
    description: 'Document ID',
  })
  id: number;
}
