import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { DocumentsFacadeService } from './documents.facade.service';
import { CreateNewsRequest, UpdateNewsRequest } from './services/news.service';

import {
  CreateNewsDto,
  UpdateNewsDto,
  NewsStatusDto,
  CreateNewsCommentDto,
  NewsletterSubscribeDto,
} from './dto/news.dto';
import { BaseDto } from '@api/_utils/dto/base.dto';

import {
  News,
  NewsResponse,
  NewsComment,
  EditorialBoardMember,
  NewsIssue,
  ClapResponse,
} from './entities/news.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';
import { RequireSession } from '@api/_utils/decorators/require-session.decorator';

@ApiTags('SmartRotom | Documents')
@Controller('smartrotom/documents')
export class NewsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  // PUBLIC: published articles only, always. Honouring a `published` query flag
  // and falling through to getAllNews() when absent makes the INSECURE branch
  // the default — that query includes unpublished drafts, so every anonymous
  // reader gets draft content. Editors read drafts through the role-guarded
  // `GET news/all` below.
  @Public()
  @Get('news')
  @ApiOperation({ summary: 'Get published news' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News retrieved successfully.',
    type: NewsResponse,
  })
  async getNews(): Promise<NewsResponse> {
    return await this.documentsFacadeService.getPublishedNews();
  }

  // EDITORIAL: the only route that returns unpublished drafts. Declared before
  // `news/:newsId` because Nest matches in declaration order and would
  // otherwise read "all" as a news id.
  @Get('news/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET)
  @ApiOperation({ summary: 'Get all news including drafts (editorial)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All news retrieved successfully.',
    type: NewsResponse,
  })
  async getAllNews(): Promise<NewsResponse> {
    return await this.documentsFacadeService.getAllNews();
  }

  @Public()
  @Get('news/featured')
  @ApiOperation({ summary: 'Get featured news' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured news retrieved successfully.',
    type: News,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No featured news found.',
  })
  async getFeaturedNews(): Promise<News | null> {
    return await this.documentsFacadeService.getFeaturedNews();
  }

  // NOTE: 'board' and 'issues' are static segments and must stay registered
  // before the 'news/:newsId' param route below, or Nest matches them as
  // newsId="board"/"issues" (parseInt → NaN).
  @Public()
  @Get('news/board')
  @ApiOperation({ summary: 'Get the editorial board (derived from bylines)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Editorial board retrieved successfully.',
    type: [EditorialBoardMember],
  })
  async getEditorialBoard(): Promise<EditorialBoardMember[]> {
    return await this.documentsFacadeService.getEditorialBoard();
  }

  @Public()
  @Get('news/issues')
  @ApiOperation({ summary: 'Get the back-issue archive (derived by issue)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News issues retrieved successfully.',
    type: [NewsIssue],
  })
  async getNewsIssues(): Promise<NewsIssue[]> {
    return await this.documentsFacadeService.getNewsIssues();
  }

  @Public()
  @Get('news/:newsId')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News retrieved successfully.',
    type: News,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async getNewsById(@Param('newsId') newsId: string): Promise<News> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new BadRequestException('Invalid news ID');
    }
    // Published only — ids are sequential, so the unrestricted lookup made
    // every draft readable by guessing. Editors read drafts via `news/all`.
    return await this.documentsFacadeService.getPublishedNewsById(newsIdNum);
  }

  @Public()
  @Get('news/:newsId/comments')
  @ApiOperation({ summary: 'Get comments for a news article' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comments retrieved successfully.',
    type: [NewsComment],
  })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async getNewsComments(
    @Param('newsId') newsId: string,
  ): Promise<NewsComment[]> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new BadRequestException('Invalid news ID');
    }
    return await this.documentsFacadeService.getNewsComments(newsIdNum);
  }

  @Public()
  @RequireSession()
  @Post('news/:newsId/comments')
  @ApiOperation({ summary: 'Add a comment to a news article' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comment created successfully.',
    type: NewsComment,
  })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  @ApiBody({ type: CreateNewsCommentDto })
  async addNewsComment(
    @Param('newsId') newsId: string,
    @Body() createNewsCommentDto: CreateNewsCommentDto,
    @CurrentMcUuid() authorUuid: string,
  ): Promise<NewsComment> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new BadRequestException('Invalid news ID');
    }
    // The author is the session, never `dto.uuid` — that allows a comment under
    // anybody's name, with no account at all.
    return await this.documentsFacadeService.addNewsComment(
      newsIdNum,
      authorUuid,
      createNewsCommentDto.body,
    );
  }

  @Public()
  @Post('news/:newsId/clap')
  @ApiOperation({ summary: 'Clap a news article (reader appreciation)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clap registered successfully.',
    type: ClapResponse,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  @ApiBody({ type: BaseDto })
  async clapNews(
    @Param('newsId') newsId: string,
    @Body() _body: BaseDto,
  ): Promise<ClapResponse> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new BadRequestException('Invalid news ID');
    }
    return await this.documentsFacadeService.clapNews(newsIdNum);
  }

  @Post('news')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET)
  @ApiOperation({ summary: 'Create new news' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'News created successfully.',
    type: News,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid news data.',
  })
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
      imageUrl: createNewsDto.imageUrl,
      author: createNewsDto.author,
      authorRole: createNewsDto.authorRole,
      issue: createNewsDto.issue,
    };
    return await this.documentsFacadeService.createNews(createNewsRequest);
  }

  @Put('news/:newsId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET)
  @ApiOperation({ summary: 'Update news' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News updated successfully.',
    type: News,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  @ApiBody({ type: UpdateNewsDto })
  async updateNews(
    @Body() updateNewsDto: UpdateNewsDto,
    @Param('newsId') newsId: string,
  ): Promise<News> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new BadRequestException('Invalid news ID');
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
      imageUrl: updateNewsDto.imageUrl,
      author: updateNewsDto.author,
      authorRole: updateNewsDto.authorRole,
      issue: updateNewsDto.issue,
    };

    return await this.documentsFacadeService.updateNews(
      newsIdNum,
      updateNewsRequest,
    );
  }

  @Delete('news/:newsId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET)
  @ApiOperation({ summary: 'Delete news' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News deleted successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'News not found.' })
  @ApiParam({ name: 'newsId', description: 'News ID' })
  async deleteNews(@Param('newsId') newsId: string): Promise<SuccessResponse> {
    const newsIdNum = parseInt(newsId, 10);
    if (isNaN(newsIdNum)) {
      throw new BadRequestException('Invalid news ID');
    }
    return await this.documentsFacadeService.deleteNews(newsIdNum);
  }

  @Delete('news/comments/:commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET)
  @ApiOperation({ summary: 'Delete a news comment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comment deleted successfully.',
    type: SuccessResponse,
  })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  async deleteNewsComment(
    @Param('commentId') commentId: string,
  ): Promise<SuccessResponse> {
    const commentIdNum = parseInt(commentId, 10);
    if (isNaN(commentIdNum)) {
      throw new BadRequestException('Invalid comment ID');
    }
    return await this.documentsFacadeService.deleteNewsComment(commentIdNum);
  }

  @Post('newsstatus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET)
  @ApiOperation({ summary: 'Update news status (published and featured)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News status updated successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status data.',
  })
  @ApiBody({ type: NewsStatusDto })
  async updateNewsStatus(
    @Body() newsStatusDto: NewsStatusDto,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.updateNewsStatus(
      newsStatusDto.published,
      newsStatusDto.featured,
    );
  }

  @Public()
  @Post('newsletter')
  @ApiOperation({ summary: 'Subscribe an email to the newsletter' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscribed successfully.',
    type: SuccessResponse,
  })
  @ApiBody({ type: NewsletterSubscribeDto })
  async subscribeNewsletter(
    @Body() newsletterSubscribeDto: NewsletterSubscribeDto,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.subscribeNewsletter(
      newsletterSubscribeDto.email,
    );
  }
}
