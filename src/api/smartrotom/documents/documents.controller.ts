import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpStatus, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { DocumentsFacadeService } from './documents.facade.service';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import {
  CreateDocumentRequest,
  CreateDocumentResponse,
  UpdateDocumentRequest,
  UpdateDocumentResponse,
  DeleteDocumentResponse,
  DocumentResponse,
  SaveDocumentResponse,
  CreateNoteWithUserRequest,
  CreateNoteWithUserResponse,
  GetUserNotesResponse,
  AddNoteToUserResponse,
  RemoveNoteFromUserResponse,
  CreateNewsRequest,
  CreateNewsResponse,
  UpdateNewsRequest,
  UpdateNewsResponse,
  DeleteNewsResponse,
  GetAllNewsResponse,
  GetPublishedNewsResponse,
  NewsResponse,
  UpdateNewsStatusRequest,
  UpdateNewsStatusResponse,
  SaveNewsRequest,
  SaveNewsResponse
} from '@api/smartrotom/documents/types/documents.types';

@ApiTags('SmartRotom | Documents')
@Controller('smartrotom/documents')
@UseInterceptors(ResponseInterceptor)
export class DocumentsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  // ==================== DOCUMENT ENDPOINTS ====================

  @Get('document/:id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getDocumentById(@Param('id', ParseIntPipe) id: number): Promise<DocumentResponse | null> {
    return await this.documentsFacadeService.getDocumentById(id);
  }

  @Post('document')
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid document data.' })
  @ApiBody({ type: Object })
  async createDocument(@Body() createDocumentRequest: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    return await this.documentsFacadeService.createDocument(createDocumentRequest);
  }

  @Put('document/:id')
  @ApiOperation({ summary: 'Update a document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: Object })
  async updateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentRequest: UpdateDocumentRequest
  ): Promise<UpdateDocumentResponse> {
    return await this.documentsFacadeService.updateDocument(id, updateDocumentRequest);
  }

  @Delete('document/:id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async deleteDocument(@Param('id', ParseIntPipe) id: number): Promise<DeleteDocumentResponse> {
    return await this.documentsFacadeService.deleteDocument(id);
  }

  @Post('document/:id/save')
  @ApiOperation({ summary: 'Save a document (create or update)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document saved successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid document data.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: Object })
  async saveDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() saveData: { title: string; content: string; type: number }
  ): Promise<SaveDocumentResponse> {
    return await this.documentsFacadeService.saveDocument(id, saveData.title, saveData.content, saveData.type);
  }

  // ==================== NOTE ENDPOINTS ====================

  @Get('notes/:uuid')
  @ApiOperation({ summary: 'Get all notes for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User notes retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getUserNotes(@Param('uuid') uuid: string): Promise<GetUserNotesResponse> {
    return await this.documentsFacadeService.getUserNotes({ uuid });
  }

  @Post('note/create')
  @ApiOperation({ summary: 'Create a note and associate it with a user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Note created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid note data.' })
  @ApiBody({ type: Object })
  async createNoteWithUser(@Body() createNoteRequest: CreateNoteWithUserRequest): Promise<CreateNoteWithUserResponse> {
    return await this.documentsFacadeService.createNoteWithUser(createNoteRequest);
  }

  @Post('note/:documentId/user/:uuid')
  @ApiOperation({ summary: 'Add a note to a user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Note added to user successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data.' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async addNoteToUser(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Param('uuid') uuid: string
  ): Promise<AddNoteToUserResponse> {
    return await this.documentsFacadeService.addNoteToUser({ documentId, uuid });
  }

  @Delete('note/:documentId/user/:uuid')
  @ApiOperation({ summary: 'Remove a note from a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note removed from user successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Note or user not found.' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async removeNoteFromUser(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Param('uuid') uuid: string
  ): Promise<RemoveNoteFromUserResponse> {
    return await this.documentsFacadeService.removeNoteFromUser({ documentId, uuid });
  }

  // ==================== NEWS ENDPOINTS ====================

  @Get('news')
  @ApiOperation({ summary: 'Get all news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All news retrieved successfully.' })
  @ApiQuery({ name: 'published', required: false, description: 'Filter by published status' })
  async getAllNews(@Query('published') published?: string): Promise<GetAllNewsResponse | GetPublishedNewsResponse> {
    if (published === 'true') {
      return await this.documentsFacadeService.getPublishedNews();
    }
    return await this.documentsFacadeService.getAllNews();
  }

  @Get('news/published')
  @ApiOperation({ summary: 'Get published news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Published news retrieved successfully.' })
  async getPublishedNews(): Promise<GetPublishedNewsResponse> {
    return await this.documentsFacadeService.getPublishedNews();
  }

  @Get('news/featured')
  @ApiOperation({ summary: 'Get featured news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Featured news retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No featured news found.' })
  async getFeaturedNews(): Promise<NewsResponse | null> {
    return await this.documentsFacadeService.getFeaturedNews();
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async getNewsById(@Param('newsId', ParseIntPipe) newsId: number): Promise<NewsResponse | null> {
    return await this.documentsFacadeService.getNewsById(newsId);
  }

  @Post('news')
  @ApiOperation({ summary: 'Create new news' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'News created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid news data.' })
  @ApiBody({ type: Object })
  async createNews(@Body() createNewsRequest: CreateNewsRequest): Promise<CreateNewsResponse> {
    return await this.documentsFacadeService.createNews(createNewsRequest);
  }

  @Put('news/:newsId')
  @ApiOperation({ summary: 'Update news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  @ApiBody({ type: Object })
  async updateNews(
    @Param('newsId', ParseIntPipe) newsId: number,
    @Body() updateNewsRequest: UpdateNewsRequest
  ): Promise<UpdateNewsResponse> {
    return await this.documentsFacadeService.updateNews(newsId, updateNewsRequest);
  }

  @Delete('news/:newsId')
  @ApiOperation({ summary: 'Delete news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async deleteNews(@Param('newsId', ParseIntPipe) newsId: number): Promise<DeleteNewsResponse> {
    return await this.documentsFacadeService.deleteNews(newsId);
  }

  @Put('news/status')
  @ApiOperation({ summary: 'Update news status (published/featured)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News status updated successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status data.' })
  @ApiBody({ type: Object })
  async updateNewsStatus(@Body() updateStatusRequest: UpdateNewsStatusRequest): Promise<UpdateNewsStatusResponse> {
    return await this.documentsFacadeService.updateNewsStatus(updateStatusRequest);
  }

  @Post('news/save')
  @ApiOperation({ summary: 'Save news (create or update)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News saved successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid news data.' })
  @ApiBody({ type: Object })
  async saveNews(@Body() saveNewsRequest: SaveNewsRequest): Promise<SaveNewsResponse> {
    return await this.documentsFacadeService.saveNews(saveNewsRequest);
  }

  // ==================== LEGACY ENDPOINTS ====================

  @Get('documents/:uuid')
  @ApiOperation({ summary: 'Get user documents (legacy endpoint)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User documents retrieved successfully.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getUserDocuments(@Param('uuid') uuid: string): Promise<GetUserNotesResponse> {
    // This is just an alias for getUserNotes to maintain backward compatibility
    return await this.documentsFacadeService.getUserNotes({ uuid });
  }

  @Post('documents')
  @ApiOperation({ summary: 'Create document (legacy endpoint)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document created successfully.' })
  @ApiBody({ type: Object })
  async createDocumentLegacy(@Body() createDocumentRequest: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    // This is just an alias for createDocument to maintain backward compatibility
    return await this.documentsFacadeService.createDocument(createDocumentRequest);
  }
}