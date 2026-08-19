import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ForumPostsRepository,
  PostRow,
  PostState,
} from '../repositories/forum-posts.repository';
import { ForumThreadsRepository } from '../repositories/forum-threads.repository';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { ListPostsQueryDto } from '../dto/list-posts-query.dto';
import { ForumPost } from '../entities/forum-post.entity';
import { ForumPostList } from '../entities/forum-post-list.entity';
import { toForumAuthor } from '../forum.mapper';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly repo: ForumPostsRepository,
    private readonly threadsRepo: ForumThreadsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async getPostsByThread(
    threadId: number,
    query: ListPostsQueryDto,
  ): Promise<ForumPostList> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total, opId] = await Promise.all([
      this.repo.findByThreadId(threadId, page, limit),
      this.repo.countByThreadId(threadId),
      this.repo.findOpId(threadId),
    ]);

    return {
      items: rows.map((r) => this.mapPost(r, opId)),
      total,
      page,
      pageSize: limit,
    };
  }

  // Adds a reply, then advances the thread's reply count and last-activity
  // pointer (the reply's createdAt doubles as the new lastPostAt).
  async createReply(
    threadId: number,
    userId: number,
    body: string,
  ): Promise<ForumPost> {
    const thread = await this.threadsRepo.findState(threadId);
    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.locked) throw new ForbiddenException('Thread is locked');

    const now = new Date();
    // insertReply now advances the thread counters inside its own transaction,
    // so the post and the counts can no longer disagree.
    const postId = await this.repo.insertReply(threadId, userId, body, now);
    await this.notifyReply(threadId, userId);

    const row = await this.repo.findRowById(postId);
    if (!row) throw new NotFoundException('Post not found');
    // A brand-new reply is never the OP.
    return this.mapPost(row, null);
  }

  // Tells the thread author someone replied. Best-effort: a failed notification
  // must never fail the reply itself (and authors don't notify themselves).
  private async notifyReply(
    threadId: number,
    replierId: number,
  ): Promise<void> {
    try {
      const ref = await this.threadsRepo.findNotifyRef(threadId);
      if (!ref || ref.authorId === replierId) return;
      await this.notifications.create({
        userId: ref.authorId,
        type: 'forum',
        title: 'Nueva respuesta en tu hilo',
        body: ref.title,
        link: `/foro/${ref.catSlug}/${threadId}`,
      });
    } catch {
      // swallow — notifications are best-effort
    }
  }

  async editPost(
    postId: number,
    userId: number,
    roles: string[] | undefined,
    body: string,
  ): Promise<ForumPost> {
    const post = await this.repo.findState(postId);
    if (!post) throw new NotFoundException('Post not found');
    this.assertAuthorOrAdmin(post.userId, userId, roles);

    await this.repo.updateBody(postId, body);

    const row = await this.repo.findRowById(postId);
    if (!row) throw new NotFoundException('Post not found');
    const opId = await this.repo.findOpId(row.threadId);
    return this.mapPost(row, opId);
  }

  async deletePost(
    postId: number,
    userId: number,
    roles: string[] | undefined,
  ): Promise<SuccessResponse> {
    const post = await this.repo.findState(postId);
    if (!post) throw new NotFoundException('Post not found');
    this.assertAuthorOrAdmin(post.userId, userId, roles);

    // The OP can't be deleted on its own — the whole thread must go instead.
    const opId = await this.repo.findOpId(post.threadId);
    if (opId === postId) {
      throw new BadRequestException(
        'Cannot delete the original post; delete the thread instead',
      );
    }

    await this.repo.softDelete(postId);
    await this.threadsRepo.decrementReply(post.threadId);

    // If the removed reply was the thread's last post, move the pointer back to
    // the newest remaining post (the OP always survives, so this is non-null).
    const newest = await this.repo.newestPost(post.threadId);
    if (newest && this.isOlder(newest, post)) {
      await this.threadsRepo.setLastPost(
        post.threadId,
        newest.createdAt,
        newest.userId,
      );
    }

    return { success: true };
  }

  private assertAuthorOrAdmin(
    ownerId: number,
    userId: number,
    roles: string[] | undefined,
  ): void {
    const isAdmin = roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    if (ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('Not allowed to modify this post');
    }
  }

  // Whether `a` predates `b` under the same (createdAt, id) ordering used for the
  // OP/newest tie-break. Used to detect that the deleted post was the last one.
  private isOlder(a: PostState, b: PostState): boolean {
    const at = a.createdAt.getTime();
    const bt = b.createdAt.getTime();
    return at < bt || (at === bt && a.id < b.id);
  }

  private mapPost(row: PostRow, opId: number | null): ForumPost {
    return {
      id: row.id,
      threadId: row.threadId,
      author: toForumAuthor({
        id: row.authorId,
        username: row.authorUsername,
        profilePicture: row.authorPicture,
      }),
      body: row.body,
      isSolution: row.isSolution,
      isOp: opId != null && row.id === opId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
