import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CurrentMcUuid,
  CurrentMcUuidOptional,
} from '@api/_utils/decorators/current-user.decorator';
import { OptionalAuth } from '@api/_utils/decorators/optional-auth.decorator';
import {
  DocumentsFacadeService,
  CreateNoteWithUserRequest,
} from './documents.facade.service';
import { UpdateDocumentRequest } from './services/document.service';

import {
  CreateDocumentDto,
  UpdateDocumentDto,
  AddNoteToUserDto,
} from './dto/document.dto';

import {
  Document,
  NotePreview,
  CreateNoteResponse,
  SaveDocumentResponse,
} from './entities/document.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

/**
 * Notes.
 *
 * The owner is the authenticated principal's Minecraft uuid and nothing else.
 * Taking it from the URL or the body (`GET all/:uuid`, `POST create { uuid }`)
 * lets an unauthenticated caller read, edit and permanently purge anybody's
 * notes by guessing an integer, so no route does. The only one reachable
 * without a session reads a note explicitly marked public, checked server-side.
 *
 * Do not reintroduce `:uuid` variants of these routes as a compatibility shim:
 * they are a second, unguarded way into the same data.
 */
@ApiTags('SmartRotom | Documents')
@ApiBearerAuth()
@Controller('smartrotom/documents')
export class NotesController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  @OptionalAuth()
  @Get('document/:id')
  @ApiOperation({
    summary: 'Get a document by ID (public notes need no session)',
  })
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
  async getDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuidOptional() uuid: string | undefined,
  ): Promise<Document> {
    return await this.documentsFacadeService.getDocumentById(id, uuid);
  }

  @Post('document')
  @ApiOperation({ summary: 'Create a new document owned by the caller' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document created successfully.',
    type: Document,
  })
  @ApiBody({ type: CreateDocumentDto })
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<Document> {
    const createDocumentRequest: CreateNoteWithUserRequest = {
      title: createDocumentDto.title,
      content: createDocumentDto.content,
      type: createDocumentDto.type,
      uuid,
    };
    const created = await this.documentsFacadeService.createNoteWithUser(
      createDocumentRequest,
    );
    return await this.documentsFacadeService.getDocumentById(created.id, uuid);
  }

  @Put('document/:id')
  @ApiOperation({ summary: 'Update a document the caller owns' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document updated successfully.',
    type: Document,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The document belongs to someone else.',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: UpdateDocumentDto })
  async updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<Document> {
    const updateDocumentRequest: UpdateDocumentRequest = {
      title: updateDocumentDto.title,
      content: updateDocumentDto.content,
      type: updateDocumentDto.type,
      public: updateDocumentDto.public,
      pinned: updateDocumentDto.pinned,
      folderId: updateDocumentDto.folderId,
    };
    return await this.documentsFacadeService.updateDocument(
      id,
      uuid,
      updateDocumentRequest,
    );
  }

  @Post('document/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted document from the trash' })
  @ApiResponse({ status: HttpStatus.OK, type: Document })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async restoreDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<Document> {
    return await this.documentsFacadeService.restoreDocument(id, uuid);
  }

  @Delete('document/:id/purge')
  @ApiOperation({ summary: 'Permanently delete a document the caller owns' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async purgeDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.purgeDocument(id, uuid);
  }

  @Get('document/:id/shares')
  @ApiOperation({ summary: 'List UUIDs a document is shared with' })
  @ApiResponse({ status: HttpStatus.OK, type: [String] })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getDocumentShares(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<string[]> {
    // Reading the share list is itself an ownership-gated read.
    await this.documentsFacadeService.getDocumentById(id, uuid);
    return await this.documentsFacadeService.getDocumentShares(id);
  }

  @Delete('document/:id')
  @ApiOperation({ summary: 'Move a document the caller owns to the trash' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully.',
    type: SuccessResponse,
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.deleteDocument(id, uuid);
  }

  @Get('trash')
  @ApiOperation({ summary: "Get the caller's soft-deleted notes" })
  @ApiResponse({ status: HttpStatus.OK, type: [NotePreview] })
  async getTrash(@CurrentMcUuid() uuid: string): Promise<NotePreview[]> {
    return await this.documentsFacadeService.getTrashedNotes(uuid);
  }

  @Get('notes')
  @ApiOperation({ summary: "Get the caller's notes" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notes retrieved successfully.',
    type: [NotePreview],
  })
  async getNotes(@CurrentMcUuid() uuid: string): Promise<NotePreview[]> {
    return await this.documentsFacadeService.getUserNotes(uuid);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a note owned by the caller' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Note created successfully.',
    type: CreateNoteResponse,
  })
  @ApiBody({ type: CreateDocumentDto })
  async createNote(
    @Body() body: CreateDocumentDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<CreateNoteResponse> {
    const createNoteRequest: CreateNoteWithUserRequest = {
      title: body.title,
      content: body.content,
      type: body.type,
      uuid,
    };
    return await this.documentsFacadeService.createNoteWithUser(
      createNoteRequest,
    );
  }

  @Post('save/:id')
  @ApiOperation({ summary: 'Save a note (create or update)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note saved successfully.',
    type: SaveDocumentResponse,
  })
  @ApiParam({ name: 'id', description: 'Note ID (0 for new note)' })
  @ApiBody({ type: CreateDocumentDto })
  async saveNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateDocumentDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<SaveDocumentResponse> {
    return await this.documentsFacadeService.saveDocument(
      id,
      uuid,
      body.title,
      body.content,
      body.type,
    );
  }

  @Post('note/user')
  @ApiOperation({ summary: 'Share a note the caller owns with another player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note associated with user successfully.',
    type: SuccessResponse,
  })
  @ApiBody({ type: AddNoteToUserDto })
  async addNoteToUser(
    @Body() addNoteToUserDto: AddNoteToUserDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    // Only a holder may hand the note to someone else.
    await this.documentsFacadeService.getDocumentById(
      addNoteToUserDto.documentId,
      uuid,
    );
    return await this.documentsFacadeService.addNoteToUser(
      addNoteToUserDto.documentId,
      addNoteToUserDto.uuid,
    );
  }

  @Delete('note/user')
  @ApiOperation({ summary: 'Remove a share from a note the caller owns' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note removed from user successfully.',
    type: SuccessResponse,
  })
  @ApiBody({ type: AddNoteToUserDto })
  async removeNoteFromUser(
    @Body() removeNoteDto: AddNoteToUserDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    await this.documentsFacadeService.getDocumentById(
      removeNoteDto.documentId,
      uuid,
    );
    return await this.documentsFacadeService.removeNoteFromUser(
      removeNoteDto.documentId,
      removeNoteDto.uuid,
    );
  }
}
