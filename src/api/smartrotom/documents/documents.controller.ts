import { Body, Controller, Get, Param, Post, Put, Delete, HttpStatus, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { DocumentsFacadeService, CreateNoteWithUserRequest } from './documents.facade.service';
import { CreateNewsRequest, UpdateNewsRequest } from './services/news.service';
import { CreateDocumentRequest, UpdateDocumentRequest } from './services/document.service';
import { CreateNewsDto } from './dto/create-news-dto';
import { NewsStatusDto } from './dto/news-status-dto';
import { CreateDocumentDto, CreateDocumentDtoWithUuid } from './dto/create-document.dto';

@ApiTags('smartrotom/documents')
@Controller('smartrotom/documents')
@UseInterceptors(ResponseInterceptor)
export class DocumentsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  // ==================== DOCUMENT ENDPOINTS ====================

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getDocument(@Param('id') id: string) {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.getDocumentById(documentId);
  }

  @Post('document')
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid document data.' })
  @ApiBody({ type: CreateDocumentDto })
  async createDocument(@Body() createDocumentDto: CreateDocumentDto) {
    const createDocumentRequest: CreateDocumentRequest = {
      title: createDocumentDto.title,
      content: createDocumentDto.content,
      type: createDocumentDto.type
    };
    return await this.documentsFacadeService.createDocument(createDocumentRequest);
  }

  @Put('document/:id')
  @ApiOperation({ summary: 'Update an existing document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: CreateDocumentDto })
  async updateDocument(@Param('id') id: string, @Body() updateDocumentDto: CreateDocumentDto) {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }

    const updateDocumentRequest: UpdateDocumentRequest = {
      title: updateDocumentDto.title,
      content: updateDocumentDto.content,
      type: updateDocumentDto.type
    };
    return await this.documentsFacadeService.updateDocument(documentId, updateDocumentRequest);
  }

  @Delete('document/:id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async deleteDocument(@Param('id') id: string) {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.deleteDocument(documentId);
  }

  // ==================== NOTE ENDPOINTS ====================

  @Get('all/:uuid')
  @ApiOperation({ summary: 'Get notes for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notes retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve notes.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getNotes(@Param('uuid') uuid: string) {
    return await this.documentsFacadeService.getUserNotes(uuid);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new note and associate with user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Note created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid note data.' })
  @ApiBody({ type: CreateDocumentDtoWithUuid })
  async createNote(@Body() body: CreateDocumentDtoWithUuid) {
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
  @ApiResponse({ status: HttpStatus.OK, description: 'Note saved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to save note.' })
  @ApiParam({ name: 'id', description: 'Note ID (0 for new note)' })
  @ApiBody({ type: CreateDocumentDto })
  async saveNote(@Param('id') id: string, @Body() body: CreateDocumentDto) {
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.saveDocument(noteId, body.title, body.content, body.type);
  }

  @Post('note/:noteId/user/:uuid')
  @ApiOperation({ summary: 'Associate a note with a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note associated with user successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Note or user not found.' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async addNoteToUser(@Param('noteId') noteId: string, @Param('uuid') uuid: string) {
    const noteIdNum = parseInt(noteId, 10);
    if (isNaN(noteIdNum)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.addNoteToUser(noteIdNum, uuid);
  }

  @Delete('note/:noteId/user/:uuid')
  @ApiOperation({ summary: 'Remove association between note and user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note removed from user successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Association not found.' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async removeNoteFromUser(@Param('noteId') noteId: string, @Param('uuid') uuid: string) {
    const noteIdNum = parseInt(noteId, 10);
    if (isNaN(noteIdNum)) {
      throw new Error('Invalid note ID');
    }
    return await this.documentsFacadeService.removeNoteFromUser(noteIdNum, uuid);
  }

  // ==================== NEWS ENDPOINTS ====================

  @Get('news')
  @ApiOperation({ summary: 'Get all news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.' })
  @ApiQuery({ name: 'published', description: 'Filter by published status', required: false })
  async getNews(@Query('published') published?: string) {
    if (published === 'true') {
      return await this.documentsFacadeService.getPublishedNews();
    }
    return await this.documentsFacadeService.getAllNews();
  }

  @Get('news/featured')
  @ApiOperation({ summary: 'Get featured news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Featured news retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No featured news found.' })
  async getFeaturedNews() {
    return await this.documentsFacadeService.getFeaturedNews();
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async getNewsById(@Param('newsId') newsId: string) {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new Error('Invalid news ID');
    }
    return await this.documentsFacadeService.getNewsById(newsIdNum);
  }

  @Post('news')
  @ApiOperation({ summary: 'Create new news' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'News created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid news data.' })
  @ApiBody({ type: CreateNewsDto })
  async createNews(@Body() createNewsDto: CreateNewsDto) {
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

  @Post('news/:newsId')
  @ApiOperation({ summary: 'Update existing news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  @ApiBody({ type: CreateNewsDto })
  async updateActiveNews(@Body() news: CreateNewsDto, @Param('newsId') newsId: string) {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new Error('Invalid news ID');
    }
    
    const updateNewsRequest: UpdateNewsRequest = {
      title: news.title,
      subtitle: news.subtitle,
      category: news.category,
      subcategory: news.subcategory,
      published: news.published,
      featured: news.featured,
      content: news.content,
      buttonText: news.buttonText,
      imageUrl: news.imageUrl
    };
    return await this.documentsFacadeService.updateNews(newsIdNum, updateNewsRequest);
  }

  @Put('news/:newsId')
  @ApiOperation({ summary: 'Update news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  @ApiBody({ type: CreateNewsDto })
  async updateNews(@Body() news: CreateNewsDto, @Param('newsId') newsId: string) {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new Error('Invalid news ID');
    }
    
    const updateNewsRequest: UpdateNewsRequest = {
      title: news.title,
      subtitle: news.subtitle,
      category: news.category,
      subcategory: news.subcategory,
      published: news.published,
      featured: news.featured,
      content: news.content,
      buttonText: news.buttonText,
      imageUrl: news.imageUrl
    };
    return await this.documentsFacadeService.updateNews(newsIdNum, updateNewsRequest);
  }

  @Delete('news/:newsId')
  @ApiOperation({ summary: 'Delete news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async deleteNews(@Param('newsId') newsId: string) {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new Error('Invalid news ID');
    }
    return await this.documentsFacadeService.deleteNews(newsIdNum);
  }

  @Post('newsstatus')
  @ApiOperation({ summary: 'Update news status (published and featured)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News status updated successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status data.' })
  @ApiBody({ type: NewsStatusDto })
  async updateNewsStatus(@Body() news: NewsStatusDto) {
    return await this.documentsFacadeService.updateNewsStatus(news.published, news.featured);
  }

  // ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

  @Post('save/:id')
  @ApiOperation({ summary: 'Save a note (legacy endpoint)' })
  async saveNoteLegacy(@Param('id') id: number, @Body() body: CreateDocumentDto) {
    return await this.documentsFacadeService.saveDocument(id, body.title, body.content, body.type);
  }
}