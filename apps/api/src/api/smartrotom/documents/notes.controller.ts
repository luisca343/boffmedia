import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  DocumentsFacadeService,
  CreateNoteWithUserRequest,
} from './documents.facade.service';
import {
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from './services/document.service';

import {
  CreateDocumentDto,
  CreateDocumentDtoWithUuid,
  UpdateDocumentDto,
  GetUserDocumentsDto,
  AddNoteToUserDto,
} from './dto/document.dto';

import {
  Document,
  NotePreview,
  CreateNoteResponse,
  SaveDocumentResponse,
} from './entities/document.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

@ApiTags('SmartRotom | Documents')
@Controller('smartrotom/documents')
export class NotesController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  @Public()
  @Get('document/:id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document retrieved successfully.',
    type: Document,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getDocument(@Param('id') id: string): Promise<Document> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.getDocumentById(documentId);
  }

  @Public()
  @Post('document')
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document created successfully.',
    type: Document,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid document data.',
  })
  @ApiBody({ type: CreateDocumentDto })
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<Document> {
    const createDocumentRequest: CreateDocumentRequest = {
      title: createDocumentDto.title,
      content: createDocumentDto.content,
      type: createDocumentDto.type,
    };
    return await this.documentsFacadeService.createDocument(
      createDocumentRequest,
    );
  }

  @Public()
  @Put('document/:id')
  @ApiOperation({ summary: 'Update an existing document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document updated successfully.',
    type: Document,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: UpdateDocumentDto })
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }

    const updateDocumentRequest: UpdateDocumentRequest = {
      title: updateDocumentDto.title,
      content: updateDocumentDto.content,
      type: updateDocumentDto.type,
      public: updateDocumentDto.public,
      pinned: updateDocumentDto.pinned,
      folderId: updateDocumentDto.folderId,
    };
    return await this.documentsFacadeService.updateDocument(
      documentId,
      updateDocumentRequest,
    );
  }

  @Public()
  @Post('document/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted document from the trash' })
  @ApiResponse({ status: HttpStatus.OK, type: Document })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async restoreDocument(@Param('id') id: string): Promise<Document> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.restoreDocument(documentId);
  }

  @Public()
  @Delete('document/:id/purge')
  @ApiOperation({ summary: 'Permanently delete a document' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async purgeDocument(@Param('id') id: string): Promise<SuccessResponse> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.purgeDocument(documentId);
  }

  @Public()
  @Get('document/:id/shares')
  @ApiOperation({ summary: 'List UUIDs a document is shared with' })
  @ApiResponse({ status: HttpStatus.OK, type: [String] })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getDocumentShares(@Param('id') id: string): Promise<string[]> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.getDocumentShares(documentId);
  }

  @Public()
  @Delete('document/:id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async deleteDocument(@Param('id') id: string): Promise<SuccessResponse> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.deleteDocument(documentId);
  }

  @Public()
  @Get('trash/:uuid')
  @ApiOperation({ summary: 'Get soft-deleted notes for a user' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotePreview] })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getTrash(@Param('uuid') uuid: string): Promise<NotePreview[]> {
    return await this.documentsFacadeService.getTrashedNotes(uuid);
  }

  @Public()
  @Post('notes') // Changed from GET to POST to use request body
  @ApiOperation({ summary: 'Get notes for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notes retrieved successfully.',
    type: [NotePreview],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve notes.',
  })
  @ApiBody({ type: GetUserDocumentsDto })
  async getNotes(
    @Body() getUserDocumentsDto: GetUserDocumentsDto,
  ): Promise<NotePreview[]> {
    return await this.documentsFacadeService.getUserNotes(
      getUserDocumentsDto.uuid,
    );
  }

  // Keep the existing GET endpoint for backward compatibility
  @Public()
  @Get('all/:uuid')
  @ApiOperation({ summary: 'Get notes for a player (legacy)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notes retrieved successfully.',
    type: [NotePreview],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve notes.',
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getNotesLegacy(@Param('uuid') uuid: string): Promise<NotePreview[]> {
    return await this.documentsFacadeService.getUserNotes(uuid);
  }

  @Public()
  @Post('create')
  @ApiOperation({ summary: 'Create a new note and associate with user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Note created successfully.',
    type: CreateNoteResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid note data.',
  })
  @ApiBody({ type: CreateDocumentDtoWithUuid })
  async createNote(
    @Body() body: CreateDocumentDtoWithUuid,
  ): Promise<CreateNoteResponse> {
    const createNoteRequest: CreateNoteWithUserRequest = {
      title: body.title,
      content: body.content,
      type: body.type,
      uuid: body.uuid,
    };
    return await this.documentsFacadeService.createNoteWithUser(
      createNoteRequest,
    );
  }

  @Public()
  @Post('save/:id')
  @ApiOperation({ summary: 'Save a note (create or update)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note saved successfully.',
    type: SaveDocumentResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to save note.',
  })
  @ApiParam({ name: 'id', description: 'Note ID (0 for new note)' })
  @ApiBody({ type: CreateDocumentDto })
  async saveNote(
    @Param('id') id: string,
    @Body() body: CreateDocumentDto,
  ): Promise<SaveDocumentResponse> {
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.saveDocument(
      noteId,
      body.title,
      body.content,
      body.type,
    );
  }

  @Public()
  @Post('note/user') // Changed to use request body instead of path params
  @ApiOperation({ summary: 'Associate a note with a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note associated with user successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Note or user not found.',
  })
  @ApiBody({ type: AddNoteToUserDto })
  async addNoteToUser(
    @Body() addNoteToUserDto: AddNoteToUserDto,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.addNoteToUser(
      addNoteToUserDto.documentId,
      addNoteToUserDto.uuid,
    );
  }

  // Keep the existing endpoint for backward compatibility
  @Public()
  @Post('note/:noteId/user/:uuid')
  @ApiOperation({ summary: 'Associate a note with a user (legacy)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note associated with user successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Note or user not found.',
  })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async addNoteToUserLegacy(
    @Param('noteId') noteId: string,
    @Param('uuid') uuid: string,
  ): Promise<SuccessResponse> {
    const noteIdNum = parseInt(noteId, 10);
    if (isNaN(noteIdNum)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.addNoteToUser(noteIdNum, uuid);
  }

  @Public()
  @Delete('note/user') // Changed to use request body
  @ApiOperation({ summary: 'Remove association between note and user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note removed from user successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Association not found.',
  })
  @ApiBody({ type: AddNoteToUserDto }) // Reusing the same DTO since it has the same fields
  async removeNoteFromUser(
    @Body() removeNoteDto: AddNoteToUserDto,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.removeNoteFromUser(
      removeNoteDto.documentId,
      removeNoteDto.uuid,
    );
  }

  // Keep the existing endpoint for backward compatibility
  @Public()
  @Delete('note/:noteId/user/:uuid')
  @ApiOperation({
    summary: 'Remove association between note and user (legacy)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note removed from user successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Association not found.',
  })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async removeNoteFromUserLegacy(
    @Param('noteId') noteId: string,
    @Param('uuid') uuid: string,
  ): Promise<SuccessResponse> {
    const noteIdNum = parseInt(noteId, 10);
    if (isNaN(noteIdNum)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.removeNoteFromUser(
      noteIdNum,
      uuid,
    );
  }
}
