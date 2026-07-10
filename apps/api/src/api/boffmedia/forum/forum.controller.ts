import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@api/_utils/decorators/public.decorator';
import { OptionalAuth } from '@api/_utils/decorators/optional-auth.decorator';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { ForumFacadeService } from './forum.facade.service';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { SolveThreadDto } from './dto/solve-thread.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { SetPinnedDto } from './dto/set-pinned.dto';
import { SetLockedDto } from './dto/set-locked.dto';
import { ForumCategory } from './entities/forum-category.entity';
import { ForumThread } from './entities/forum-thread.entity';
import { ForumThreadList } from './entities/forum-thread-list.entity';
import { ForumPost } from './entities/forum-post.entity';
import { ForumPostList } from './entities/forum-post-list.entity';
import { ForumVoteResult } from './entities/forum-vote-result.entity';
import { ForumStats } from './entities/forum-stats.entity';
import { ForumMember } from './entities/forum-member.entity';

// Identity for authenticated write routes always comes from the JWT, never the
// request body — no write DTO carries a userId.
type AuthedRequest = { user: { userId: number; roles?: string[] } };

@ApiTags('BoffMedia | Forum')
@Controller('forum')
export class ForumController {
  constructor(private readonly forumFacadeService: ForumFacadeService) {}

  @OptionalAuth()
  @Get('categories')
  @ApiOperation({ summary: 'List all forum categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully.',
    type: [ForumCategory],
  })
  async getCategories(
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<ForumCategory[]> {
    return this.forumFacadeService.getCategories();
  }

  @OptionalAuth()
  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get a forum category by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully.',
    type: ForumCategory,
  })
  async getCategory(
    @Param('slug') slug: string,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<ForumCategory> {
    return this.forumFacadeService.getCategory(slug);
  }

  @OptionalAuth()
  @Get('categories/:slug/threads')
  @ApiOperation({ summary: 'List threads in a category (paginated, sortable)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Threads retrieved successfully.',
    type: ForumThreadList,
  })
  async getCategoryThreads(
    @Param('slug') slug: string,
    @Query() query: ListThreadsQueryDto,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<ForumThreadList> {
    return this.forumFacadeService.getCategoryThreads(slug, query);
  }

  @OptionalAuth()
  @Get('threads/:id')
  @ApiOperation({ summary: 'Get a thread by id (increments its view count)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thread retrieved successfully.',
    type: ForumThread,
  })
  async getThread(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<ForumThread> {
    return this.forumFacadeService.getThread(id);
  }

  @OptionalAuth()
  @Get('threads/:id/posts')
  @ApiOperation({ summary: 'List posts in a thread (OP first, paginated)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully.',
    type: ForumPostList,
  })
  async getThreadPosts(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListPostsQueryDto,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<ForumPostList> {
    return this.forumFacadeService.getThreadPosts(id, query);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get forum-wide stats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stats retrieved successfully.',
    type: ForumStats,
  })
  async getStats(): Promise<ForumStats> {
    return this.forumFacadeService.getStats();
  }

  @Public()
  @Get('online')
  @ApiOperation({ summary: 'List members active in the last 15 minutes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Online members retrieved successfully.',
    type: [ForumMember],
  })
  async getOnline(): Promise<ForumMember[]> {
    return this.forumFacadeService.getOnline();
  }

  // ==================== WRITE ====================

  @Post('threads')
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a thread (with its original post)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Thread created successfully.',
    type: ForumThread,
  })
  async createThread(
    @Body() dto: CreateThreadDto,
    @Req() req: AuthedRequest,
  ): Promise<ForumThread> {
    return this.forumFacadeService.createThread(req.user.userId, dto);
  }

  @Post('threads/:id/posts')
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reply to a thread' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reply created successfully.',
    type: ForumPost,
  })
  async createPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePostDto,
    @Req() req: AuthedRequest,
  ): Promise<ForumPost> {
    return this.forumFacadeService.createPost(id, req.user.userId, dto);
  }

  @Post('threads/:id/vote')
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Toggle the caller vote on a thread' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vote toggled successfully.',
    type: ForumVoteResult,
  })
  async voteThread(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthedRequest,
  ): Promise<ForumVoteResult> {
    return this.forumFacadeService.voteThread(id, req.user.userId);
  }

  @Post('threads/:id/solve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Mark a post as the solution (or unsolve); author or admin only',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Thread solve state updated successfully.',
    type: ForumThread,
  })
  async solveThread(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SolveThreadDto,
    @Req() req: AuthedRequest,
  ): Promise<ForumThread> {
    return this.forumFacadeService.solveThread(
      id,
      req.user.userId,
      req.user.roles,
      dto,
    );
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Edit a post; author or admin only' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post updated successfully.',
    type: ForumPost,
  })
  async editPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditPostDto,
    @Req() req: AuthedRequest,
  ): Promise<ForumPost> {
    return this.forumFacadeService.editPost(
      id,
      req.user.userId,
      req.user.roles,
      dto,
    );
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Soft-delete a reply; author or admin only' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post deleted successfully.',
    type: SuccessResponse,
  })
  async deletePost(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthedRequest,
  ): Promise<SuccessResponse> {
    return this.forumFacadeService.deletePost(
      id,
      req.user.userId,
      req.user.roles,
    );
  }

  @Patch('threads/:id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Pin or unpin a thread (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thread pin state updated successfully.',
    type: ForumThread,
  })
  async pinThread(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPinnedDto,
  ): Promise<ForumThread> {
    return this.forumFacadeService.setThreadPinned(id, dto.pinned);
  }

  @Patch('threads/:id/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Lock or unlock a thread (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thread lock state updated successfully.',
    type: ForumThread,
  })
  async lockThread(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetLockedDto,
  ): Promise<ForumThread> {
    return this.forumFacadeService.setThreadLocked(id, dto.locked);
  }

  @Post('presence/ping')
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 6 } })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mark the caller as active now' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Presence updated successfully.',
    type: SuccessResponse,
  })
  async pingPresence(@Req() req: AuthedRequest): Promise<SuccessResponse> {
    return this.forumFacadeService.pingPresence(req.user.userId);
  }
}
