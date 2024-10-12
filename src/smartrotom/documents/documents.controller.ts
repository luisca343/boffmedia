import { Body, Controller, Get, Param, Post, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { RotomNews } from '@/_db/schema/SmartRotomDocuments';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { CreateNewsDto } from './dto/create-news-dto';
import { NewsStatusDto } from './dto/news-status-dto';
import { CreateDocumentDto, CreateDocumentDtoWithUuid } from './dto/create-document.dto';

@ApiTags('smartrotom/documents')
@Controller('smartrotom/documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('news')
  @ApiOperation({ summary: 'Get all news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve news.' })
  async getNews() {
    const action = 'get all news';
    try {
      this.responseService.logRequest(action, null);
      const news = await this.documentsService.getNews();
      this.responseService.logSuccess(action, news);
      return this.responseService.createSuccessResponse('News retrieved successfully', news);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve news.' })
  async getNewsById(@Param('newsId') newsId: number) {
    const action = 'get news by ID';
    try {
      this.responseService.logRequest(action, { newsId });
      const news = await this.documentsService.getNewsById(newsId);
      this.responseService.logSuccess(action, news);
      return this.responseService.createSuccessResponse('News retrieved successfully', news);
    } catch (error) {
      this.responseService.handleError(action, error, { newsId });
    }
  }

  @Post('news/:newsId')
  @ApiOperation({ summary: 'Update active news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update news.' })
  async updateActiveNews(@Body() news: CreateNewsDto, @Param('newsId') newsId: number) {
    const action = 'update active news';
    try {
      this.responseService.logRequest(action, { news, newsId });
      const result = await this.documentsService.saveNews(news, newsId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('News updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { news, newsId });
    }
  }

  @Post('newsstatus')
  @ApiOperation({ summary: 'Update news status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News status updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update news status.' })
  async updateNewsStatus(@Body() news: NewsStatusDto) {
    const action = 'update news status';
    try {
      this.responseService.logRequest(action, news);
      const result = await this.documentsService.updateNewsStatus(news.published, news.featured);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('News status updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, news);
    }
  }

  @Get('all/:uuid')
  @ApiOperation({ summary: 'Get notes for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notes retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve notes.' })
  async getNotes(@Param('uuid') uuid: string) {
    const action = 'get notes';
    try {
      this.responseService.logRequest(action, { uuid });
      const notes = await this.documentsService.getNotes(uuid);
      this.responseService.logSuccess(action, notes);
      return this.responseService.createSuccessResponse('Notes retrieved successfully', notes);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create note.' })
  async createNote(@Body() body: CreateDocumentDtoWithUuid) {
    const action = 'create note';
    try {
      this.responseService.logRequest(action, body);
      const noteInsert = await this.documentsService.saveNote(0, body.title, body.content, body.type);
      await this.documentsService.addNoteToUser(noteInsert.id, body.uuid);
      const result = { id: noteInsert.id, success: true };
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Note created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Post('save/:id')
  @ApiOperation({ summary: 'Save a note' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note saved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to save note.' })
  async saveNote(@Param('id') id: number, @Body() body: CreateDocumentDto) {
    const action = 'save note';
    try {
      this.responseService.logRequest(action, { id, body });
      const result = await this.documentsService.saveNote(id, body.title, body.content, body.type);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Note saved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { id, body });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve document.' })
  async getDocument(@Param('id') id: number) {
    const action = 'get document by ID';
    try {
      this.responseService.logRequest(action, { id });
      const document = await this.documentsService.getDocument(id);
      this.responseService.logSuccess(action, document);
      return this.responseService.createSuccessResponse('Document retrieved successfully', document);
    } catch (error) {
      this.responseService.handleError(action, error, { id });
    }
  }
}