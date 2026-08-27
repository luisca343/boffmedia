import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ForumThreadsRepository,
  ThreadRow,
} from '../repositories/forum-threads.repository';
import { ForumPostsRepository } from '../repositories/forum-posts.repository';
import { ForumVotesRepository } from '../repositories/forum-votes.repository';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { ListThreadsQueryDto } from '../dto/list-threads-query.dto';
import { CreateThreadDto } from '../dto/create-thread.dto';
import { ForumThread } from '../entities/forum-thread.entity';
import { ForumThreadList } from '../entities/forum-thread-list.entity';
import { ForumVoteResult } from '../entities/forum-vote-result.entity';
import { toForumAuthor } from '../forum.mapper';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly repo: ForumThreadsRepository,
    private readonly postsRepo: ForumPostsRepository,
    private readonly votesRepo: ForumVotesRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async getThreadsByCategory(
    categoryId: number,
    query: ListThreadsQueryDto,
  ): Promise<ForumThreadList> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sort = query.sort ?? 'recent';

    const [rows, total] = await Promise.all([
      this.repo.findByCategoryId(categoryId, page, limit, sort),
      this.repo.countByCategoryId(categoryId),
    ]);

    return {
      items: rows.map((r) => this.mapThread(r)),
      total,
      page,
      pageSize: limit,
    };
  }

  async getThreadById(id: number): Promise<ForumThread | null> {
    const row = await this.repo.findById(id);
    if (!row) return null;

    await this.repo.incrementViewCount(id);
    // Reflect the increment in the response without a re-read.
    return this.mapThread({ ...row, viewCount: row.viewCount + 1 });
  }

  async threadExists(id: number): Promise<boolean> {
    return this.repo.existsById(id);
  }

  // Read + map without the view-count side effect (for post-write responses).
  private async getThreadNoView(id: number): Promise<ForumThread> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('Thread not found');
    return this.mapThread(row);
  }

  async createThread(
    userId: number,
    dto: CreateThreadDto,
  ): Promise<ForumThread> {
    const threadId = await this.repo.createThreadWithOp({
      categoryId: dto.categoryId,
      userId,
      title: dto.title,
      body: dto.body,
    });
    return this.getThreadNoView(threadId);
  }

  // Toggle: one vote per (user, thread). Returns the caller's new vote state and
  // the resulting (clamped) thread total.
  //
  // Race condition fix: Instead of check-then-insert, we attempt the insert directly.
  // The database unique constraint on (thread_id, user_id) ensures idempotency:
  // - If the vote doesn't exist, INSERT succeeds and we count it as a new vote.
  // - If the vote already exists, INSERT fails with a duplicate-key error; we
  //   then remove the vote (toggle off) instead.
  //
  // This eliminates the TOCTOU window between the check and the insert.
  async toggleVote(threadId: number, userId: number): Promise<ForumVoteResult> {
    let voted: boolean;
    try {
      // Attempt to insert the vote.
      await this.votesRepo.add(userId, threadId);
      // If we reach here, the vote was new.
      await this.repo.adjustVoteCount(threadId, 1);
      voted = true;
    } catch (err) {
      // Check if this is a duplicate-key error (vote already exists).
      // The global exception filter handles ER_DUP_ENTRY, so we check for both
      // the raw MySQL error and the wrapped HttpException.
      if (this.isDuplicateKeyError(err)) {
        // Vote already exists, so toggle it off.
        await this.votesRepo.remove(userId, threadId);
        await this.repo.adjustVoteCount(threadId, -1);
        voted = false;
      } else {
        // Some other error; re-throw it.
        throw err;
      }
    }
    const votes = await this.repo.getVoteCount(threadId);
    return { voted, votes };
  }

  // Detects whether an error is a duplicate-key error from the database.
  // Matches both raw MySQL2 errors and wrapped HttpExceptions.
  private isDuplicateKeyError(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const e = err as Record<string, unknown>;
    // MySQL2 native error code
    if (e['code'] === 'ER_DUP_ENTRY') return true;
    // Message-based check (covers error wrappers that preserve the message)
    if (
      typeof e['message'] === 'string' &&
      e['message'].includes('Duplicate entry')
    ) {
      return true;
    }
    return false;
  }

  // Author-or-admin only (checked here, not in the controller). postId marks a
  // post as the solution (replacing any prior one); omit it to unsolve.
  async solve(
    threadId: number,
    userId: number,
    roles: string[] | undefined,
    postId?: number | null,
  ): Promise<ForumThread> {
    const thread = await this.repo.findState(threadId);
    if (!thread) throw new NotFoundException('Thread not found');

    const isAdmin = roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    if (thread.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Not allowed to solve this thread');
    }

    if (postId != null) {
      const belongs = await this.postsRepo.existsInThread(postId, threadId);
      if (!belongs) {
        throw new NotFoundException('Post not found in this thread');
      }
      await this.postsRepo.clearSolutionForThread(threadId);
      await this.postsRepo.setSolution(postId, true);
      await this.repo.setSolved(threadId, true);
      await this.notifySolution(threadId, postId, userId);
    } else {
      await this.postsRepo.clearSolutionForThread(threadId);
      await this.repo.setSolved(threadId, false);
    }

    return this.getThreadNoView(threadId);
  }

  async setPinned(threadId: number, pinned: boolean): Promise<ForumThread> {
    const exists = await this.repo.existsById(threadId);
    if (!exists) throw new NotFoundException('Thread not found');
    await this.repo.setPinned(threadId, pinned);
    return this.getThreadNoView(threadId);
  }

  async setLocked(threadId: number, locked: boolean): Promise<ForumThread> {
    const exists = await this.repo.existsById(threadId);
    if (!exists) throw new NotFoundException('Thread not found');
    await this.repo.setLocked(threadId, locked);
    return this.getThreadNoView(threadId);
  }

  // Tells the answer's author their post was accepted as the solution.
  // Best-effort: a failed notification must never fail the solve action.
  private async notifySolution(
    threadId: number,
    postId: number,
    solverId: number,
  ): Promise<void> {
    try {
      const post = await this.postsRepo.findState(postId);
      if (!post || post.userId === solverId) return;
      const ref = await this.repo.findNotifyRef(threadId);
      if (!ref) return;
      await this.notifications.create({
        userId: post.userId,
        type: 'forum',
        title: 'Tu respuesta fue marcada como solución',
        body: ref.title,
        link: `/foro/${ref.catSlug}/${threadId}`,
      });
    } catch {
      // swallow — notifications are best-effort
    }
  }

  private mapThread(row: ThreadRow): ForumThread {
    const lastAuthor =
      row.lastUserId != null && row.lastUsername != null
        ? toForumAuthor({
            id: row.lastUserId,
            username: row.lastUsername,
            profilePicture: row.lastPicture,
          })
        : null;

    return {
      id: row.id,
      catSlug: row.catSlug,
      catName: row.catName,
      catHue: row.catHue,
      title: row.title,
      author: toForumAuthor({
        id: row.authorId,
        username: row.authorUsername,
        profilePicture: row.authorPicture,
      }),
      lastAuthor,
      lastAt: row.lastPostAt,
      createdAt: row.createdAt,
      pinned: row.pinned,
      locked: row.locked,
      solved: row.solved,
      replies: row.replyCount,
      views: row.viewCount,
      votes: row.voteCount,
    };
  }
}
