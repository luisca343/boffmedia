import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class Document {
  @ApiProperty({ 
    example: 'My Important Notes',
    description: 'Document title'
  })
  title: string;

  @ApiProperty({ 
    example: 'This is the content of my document...',
    description: 'Document content'
  })
  content: string;

  @ApiProperty({ 
    example: 1,
    description: 'Document type'
  })
  type: number;
  
  @ApiProperty({ 
    example: '2025-06-14T12:00:00.000Z',
    description: 'Document creation date'
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2025-06-14T12:00:00.000Z',
    description: 'Document last update date'
  })
  updatedAt: Date;
}

export class NotePreview {
  @ApiProperty({ 
    example: 123,
    description: 'Note ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'My Important Notes',
    description: 'Note title'
  })
  title: string;

  @ApiProperty({ 
    example: 1,
    description: 'Note type'
  })
  type: number;

  @ApiProperty({ 
    example: '2025-06-14T12:00:00.000Z',
    description: 'Note creation date'
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2025-06-14T12:00:00.000Z',
    description: 'Note last update date'
  })
  updatedAt: Date;
}

export class CreateDocumentResponse {
  @ApiProperty({ 
    example: true,
    description: 'Whether the operation was successful'
  })
  success: boolean;

  @ApiProperty({ 
    example: 'Document created successfully',
    description: 'Response message'
  })
  message: string;

  @ApiProperty({ 
    description: 'Created document details',
    type: Document
  })
  document: Document;
}

export class DocumentResponse {
  @ApiProperty({ 
    example: true,
    description: 'Whether the operation was successful'
  })
  success: boolean;

  @ApiProperty({ 
    example: 'Operation completed successfully',
    description: 'Response message'
  })
  message: string;
}

export class CreateNoteResponse {
  @ApiProperty({ 
    example: 123,
    description: 'Created note ID'
  })
  id: number;

  @ApiProperty({ 
    example: true,
    description: 'Whether the operation was successful'
  })
  success: boolean;
}

export class SaveDocumentResponse {
  @ApiProperty({ 
    example: true,
    description: 'Whether the operation was successful'
  })
  success: boolean;

  @ApiProperty({ 
    example: 123,
    description: 'Document ID'
  })
  id: number;
}