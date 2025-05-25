import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateNewsDto } from './dto/create-news-dto';
import { NewsStatusDto } from './dto/news-status-dto';
import { CreateDocumentDto, CreateDocumentDtoWithUuid } from './dto/create-document.dto';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('smartrotom/documents')
@Controller('smartrotom/documents')
@UseInterceptors(ResponseInterceptor)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) {}

  @Get('all/:uuid')
  @ApiOperation({ summary: 'Get notes for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notes retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve notes.' })
  async getNotes(@Param('uuid') uuid: string) {
    return await this.documentsService.getNotes(uuid);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create note.' })
  async createNote(@Body() body: CreateDocumentDtoWithUuid) {
    const noteInsert = await this.documentsService.saveNote(0, body.title, body.content, body.type);
    await this.documentsService.addNoteToUser(noteInsert.id, body.uuid);
    return { id: noteInsert.id, success: true };
  }

  @Get('news')
  @ApiOperation({ summary: 'Get all news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve news.' })
  async getNews() {
    return await this.documentsService.getNews();
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve news.' })
  async getNewsById(@Param('newsId') newsId: number) {
    return await this.documentsService.getNewsById(newsId);
  }

  @Post('news/:newsId')
  @ApiOperation({ summary: 'Update active news' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update news.' })
  async updateActiveNews(@Body() news: CreateNewsDto, @Param('newsId') newsId: number) {
    return await this.documentsService.saveNews(news, newsId);
  }

  @Post('newsstatus')
  @ApiOperation({ summary: 'Update news status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'News status updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update news status.' })
  async updateNewsStatus(@Body() news: NewsStatusDto) {
    return await this.documentsService.updateNewsStatus(news.published, news.featured);
  }

  @Post('save/:id')
  @ApiOperation({ summary: 'Save a note' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note saved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to save note.' })
  async saveNote(@Param('id') id: number, @Body() body: CreateDocumentDto) {
    return await this.documentsService.saveNote(id, body.title, body.content, body.type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve document.' })
  async getDocument(@Param('id') id: number) {
    return await this.documentsService.getDocument(id);
  }
}