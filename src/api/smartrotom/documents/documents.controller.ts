import { Body, Controller, Get, Param, Post, Put, Delete, HttpStatus, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { DocumentsFacadeService, CreateNoteWithUserRequest } from './documents.facade.service';
import { CreateNewsRequest, UpdateNewsRequest } from './services/news.service';
import { CreateDocumentRequest, UpdateDocumentRequest } from './services/document.service';

import { 
  CreateDocumentDto, 
  CreateDocumentDtoWithUuid, 
  UpdateDocumentDto, 
  GetUserDocumentsDto, 
  AddNoteToUserDto 
} from './dto/document.dto';
import { 
  CreateNewsDto, 
  UpdateNewsDto, 
  NewsStatusDto, 
  GetNewsDto 
} from './dto/news.dto';

import { 
  Document, 
  NotePreview, 
  CreateNoteResponse, 
  SaveDocumentResponse 
} from './entities/document.entity';
import { 
  News, 
  NewsResponse, 
} from './entities/news.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

@ApiTags('SmartRotom | Documents')
@Controller('smartrotom/documents')
@UseInterceptors(ResponseInterceptor)
export class DocumentsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  // ==================== DOCUMENT ENDPOINTS ====================

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document retrieved successfully.', type: Document })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getDocument(@Param('id') id: string): Promise<Document> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.getDocumentById(documentId);
  }

  @Post('document')
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document created successfully.', type: Document })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid document data.' })
  @ApiBody({ type: CreateDocumentDto })
  async createDocument(@Body() createDocumentDto: CreateDocumentDto): Promise<Document> {
    const createDocumentRequest: CreateDocumentRequest = {
      title: createDocumentDto.title,
      content: createDocumentDto.content,
      type: createDocumentDto.type,
    };
    return await this.documentsFacadeService.createDocument(createDocumentRequest);
  }

  @Put('document/:id')
  @ApiOperation({ summary: 'Update an existing document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document updated successfully.', type: Document })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: UpdateDocumentDto })
  async updateDocument(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }

    const updateDocumentRequest: UpdateDocumentRequest = {
      title: updateDocumentDto.title,
      content: updateDocumentDto.content,
      type: updateDocumentDto.type,
      public: updateDocumentDto.public
    };
    return await this.documentsFacadeService.updateDocument(documentId, updateDocumentRequest);
  }

  @Delete('document/:id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document deleted successfully.', type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async deleteDocument(@Param('id') id: string): Promise<SuccessResponse> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.deleteDocument(documentId);
  }

  // ==================== NOTE ENDPOINTS ====================

  @Post('notes') // Changed from GET to POST to use request body
  @ApiOperation({ summary: 'Get notes for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notes retrieved successfully.', type: [NotePreview] })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve notes.' })
  @ApiBody({ type: GetUserDocumentsDto })
  async getNotes(@Body() getUserDocumentsDto: GetUserDocumentsDto): Promise<NotePreview[]> {
    return await this.documentsFacadeService.getUserNotes(getUserDocumentsDto.uuid);
  }

  // Keep the existing GET endpoint for backward compatibility
  @Get('all/:uuid')
  @ApiOperation({ summary: 'Get notes for a player (legacy)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notes retrieved successfully.', type: [NotePreview] })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve notes.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getNotesLegacy(@Param('uuid') uuid: string): Promise<NotePreview[]> {
    return await this.documentsFacadeService.getUserNotes(uuid);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new note and associate with user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Note created successfully.', type: CreateNoteResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid note data.' })
  @ApiBody({ type: CreateDocumentDtoWithUuid })
  async createNote(@Body() body: CreateDocumentDtoWithUuid): Promise<CreateNoteResponse> {
    const createNoteRequest: CreateNoteWithUserRequest = {
      title: body.title,
      content: body.content,
      type: body.type,
      uuid: body.uuid
    };
    return await this.documentsFacadeService.createNoteWithUser(createNoteRequest);
  }

  @Post('save/:id')
  @ApiOperation({ summary: 'Save a note (create or update)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note saved successfully.', type: SaveDocumentResponse })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to save note.' })
  @ApiParam({ name: 'id', description: 'Note ID (0 for new note)' })
  @ApiBody({ type: CreateDocumentDto })
  async saveNote(@Param('id') id: string, @Body() body: CreateDocumentDto): Promise<SaveDocumentResponse> {
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.saveDocument(noteId, body.title, body.content, body.type);
  }

  @Post('note/user') // Changed to use request body instead of path params
  @ApiOperation({ summary: 'Associate a note with a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note associated with user successfully.', type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Note or user not found.' })
  @ApiBody({ type: AddNoteToUserDto })
  async addNoteToUser(@Body() addNoteToUserDto: AddNoteToUserDto): Promise<SuccessResponse> {
    return await this.documentsFacadeService.addNoteToUser(addNoteToUserDto.documentId, addNoteToUserDto.uuid);
  }

  // Keep the existing endpoint for backward compatibility
  @Post('note/:noteId/user/:uuid')
  @ApiOperation({ summary: 'Associate a note with a user (legacy)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note associated with user successfully.', type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Note or user not found.' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async addNoteToUserLegacy(@Param('noteId') noteId: string, @Param('uuid') uuid: string): Promise<SuccessResponse> {
    const noteIdNum = parseInt(noteId, 10);
    if (isNaN(noteIdNum)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.addNoteToUser(noteIdNum, uuid);
  }

  @Delete('note/user') // Changed to use request body
  @ApiOperation({ summary: 'Remove association between note and user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note removed from user successfully.', type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found.' })
  @ApiBody({ type: AddNoteToUserDto }) // Reusing the same DTO since it has the same fields
  async removeNoteFromUser(@Body() removeNoteDto: AddNoteToUserDto): Promise<SuccessResponse> {
    return await this.documentsFacadeService.removeNoteFromUser(removeNoteDto.documentId, removeNoteDto.uuid);
  }

  // Keep the existing endpoint for backward compatibility
  @Delete('note/:noteId/user/:uuid')
  @ApiOperation({ summary: 'Remove association between note and user (legacy)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note removed from user successfully.', type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found.' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async removeNoteFromUserLegacy(@Param('noteId') noteId: string, @Param('uuid') uuid: string): Promise<SuccessResponse> {
    const noteIdNum = parseInt(noteId, 10);
    if (isNaN(noteIdNum)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.removeNoteFromUser(noteIdNum, uuid);
  }

  // ==================== NEWS ENDPOINTS ====================

  @Post('news/filter') // Changed to POST to use request body
  @ApiOperation({ summary: 'Get filtered news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.', type: NewsResponse })
  @ApiBody({ type: GetNewsDto })
  async getFilteredNews(@Body() getNewsDto: GetNewsDto): Promise<NewsResponse> {
    if (getNewsDto.published === 'true') {
      return await this.documentsFacadeService.getPublishedNews();
    }
    return await this.documentsFacadeService.getAllNews();
  }

  // Keep the existing GET endpoint for backward compatibility
  @Get('news')
  @ApiOperation({ summary: 'Get all news (legacy)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.', type: NewsResponse })
  @ApiQuery({ name: 'published', description: 'Filter by published status', required: false })
  async getNews(@Query() query: GetNewsDto): Promise<NewsResponse> {
    if (query.published === 'true') {
      return await this.documentsFacadeService.getPublishedNews();
    }
    return await this.documentsFacadeService.getAllNews();
  }

  @Get('news/featured')
  @ApiOperation({ summary: 'Get featured news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Featured news retrieved successfully.', type: News })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No featured news found.' })
  async getFeaturedNews(): Promise<News | null> {
    return await this.documentsFacadeService.getFeaturedNews();
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.', type: News })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async getNewsById(@Param('newsId') newsId: string): Promise<News> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new Error('Invalid news ID');
    }
    return await this.documentsFacadeService.getNewsById(newsIdNum);
  }

  @Post('news')
  @ApiOperation({ summary: 'Create new news' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'News created successfully.', type: News })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid news data.' })
  @ApiBody({ type: CreateNewsDto })
  async createNews(@Body() createNewsDto: CreateNewsDto): Promise<News> {
    const createNewsRequest: CreateNewsRequest = {
      title: createNewsDto.title,
      subtitle: createNewsDto.subtitle,
      category: createNewsDto.category,
      subcategory: createNewsDto.subcategory,
      published: createNewsDto.published,
      featured: createNewsDto.featured,
      content: createNewsDto.content,
      buttonText: createNewsDto.buttonText,
      imageUrl: createNewsDto.imageUrl
    };
    return await this.documentsFacadeService.createNews(createNewsRequest);
  }

  @Put('news/:newsId')
  @ApiOperation({ summary: 'Update news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News updated successfully.', type: News })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  @ApiBody({ type: UpdateNewsDto })
  async updateNews(@Body() updateNewsDto: UpdateNewsDto, @Param('newsId') newsId: string): Promise<News> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new Error('Invalid news ID');
    }
    
    const updateNewsRequest: UpdateNewsRequest = {
      title: updateNewsDto.title,
      subtitle: updateNewsDto.subtitle,
      category: updateNewsDto.category,
      subcategory: updateNewsDto.subcategory,
      published: updateNewsDto.published,
      featured: updateNewsDto.featured,
      content: updateNewsDto.content,
      buttonText: updateNewsDto.buttonText,
      imageUrl: updateNewsDto.imageUrl
    };
    return await this.documentsFacadeService.updateNews(newsIdNum, updateNewsRequest);
  }

  @Delete('news/:newsId')
  @ApiOperation({ summary: 'Delete news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News deleted successfully.', type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async deleteNews(@Param('newsId') newsId: string): Promise<SuccessResponse> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new Error('Invalid news ID');
    }
    return await this.documentsFacadeService.deleteNews(newsIdNum);
  }

  @Post('newsstatus')
  @ApiOperation({ summary: 'Update news status (published and featured)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News status updated successfully.', type: SuccessResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status data.' })
  @ApiBody({ type: NewsStatusDto })
  async updateNewsStatus(@Body() newsStatusDto: NewsStatusDto): Promise<SuccessResponse> {
    return await this.documentsFacadeService.updateNewsStatus(newsStatusDto.published, newsStatusDto.featured);
  }
}