import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './services/categories.service';
import { ThreadsService } from './services/threads.service';
import { PostsService } from './services/posts.service';
import { PresenceService } from './services/presence.service';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { SolveThreadDto } from './dto/solve-thread.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { ForumCategory } from './entities/forum-category.entity';
import { ForumThread } from './entities/forum-thread.entity';
import { ForumThreadList } from './entities/forum-thread-list.entity';
import { ForumPost } from './entities/forum-post.entity';
import { ForumPostList } from './entities/forum-post-list.entity';
import { ForumVoteResult } from './entities/forum-vote-result.entity';
import { ForumStats } from './entities/forum-stats.entity';
import { ForumMember } from './entities/forum-member.entity';

@Injectable()
export class ForumFacadeService {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly threadsService: ThreadsService,
    private readonly postsService: PostsService,
    private readonly presenceService: PresenceService,
  ) {}

  getCategories(): Promise<ForumCategory[]> {
    return this.categoriesService.getCategories();
  }

  async getCategory(slug: string): Promise<ForumCategory> {
    const category = await this.categoriesService.getCategoryBySlug(slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async getCategoryThreads(
    slug: string,
    query: ListThreadsQueryDto,
  ): Promise<ForumThreadList> {
    const category = await this.categoriesService.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.threadsService.getThreadsByCategory(category.id, query);
  }

  async getThread(id: number): Promise<ForumThread> {
    // getThreadById also increments the view count when the thread exists.
    const thread = await this.threadsService.getThreadById(id);
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    return thread;
  }

  async getThreadPosts(
    id: number,
    query: ListPostsQueryDto,
  ): Promise<ForumPostList> {
    const exists = await this.threadsService.threadExists(id);
    if (!exists) {
      throw new NotFoundException('Thread not found');
    }
    return this.postsService.getPostsByThread(id, query);
  }

  getStats(): Promise<ForumStats> {
    return this.presenceService.getStats();
  }

  getOnline(): Promise<ForumMember[]> {
    return this.presenceService.getOnline();
  }

  // ==================== WRITE ====================

  async createThread(
    userId: number,
    dto: CreateThreadDto,
  ): Promise<ForumThread> {
    const category = await this.categoriesService.findById(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.locked) {
      throw new ForbiddenException('Category is locked');
    }
    return this.threadsService.createThread(userId, dto);
  }

  // Thread existence + lock are validated inside PostsService.createReply.
  createPost(
    threadId: number,
    userId: number,
    dto: CreatePostDto,
  ): Promise<ForumPost> {
    return this.postsService.createReply(threadId, userId, dto.body);
  }

  async voteThread(
    threadId: number,
    userId: number,
  ): Promise<ForumVoteResult> {
    const exists = await this.threadsService.threadExists(threadId);
    if (!exists) {
      throw new NotFoundException('Thread not found');
    }
    return this.threadsService.toggleVote(threadId, userId);
  }

  // Author-or-admin authorization lives in ThreadsService.solve.
  solveThread(
    threadId: number,
    userId: number,
    roles: string[] | undefined,
    dto: SolveThreadDto,
  ): Promise<ForumThread> {
    return this.threadsService.solve(threadId, userId, roles, dto.postId);
  }

  // Author-or-admin authorization lives in PostsService.editPost.
  editPost(
    postId: number,
    userId: number,
    roles: string[] | undefined,
    dto: EditPostDto,
  ): Promise<ForumPost> {
    return this.postsService.editPost(postId, userId, roles, dto.body);
  }

  // Author-or-admin authorization lives in PostsService.deletePost.
  deletePost(
    postId: number,
    userId: number,
    roles: string[] | undefined,
  ): Promise<SuccessResponse> {
    return this.postsService.deletePost(postId, userId, roles);
  }

  setThreadPinned(threadId: number, pinned: boolean): Promise<ForumThread> {
    return this.threadsService.setPinned(threadId, pinned);
  }

  setThreadLocked(threadId: number, locked: boolean): Promise<ForumThread> {
    return this.threadsService.setLocked(threadId, locked);
  }

  async pingPresence(userId: number): Promise<SuccessResponse> {
    await this.presenceService.touchLastSeen(userId);
    return { success: true };
  }
}
