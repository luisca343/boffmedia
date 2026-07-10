import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPATCH,
  apiAuthedAutoDELETE,
} from '@/services/boffAPI';
import type {
  ForumCategory,
  ForumThread,
  ForumThreadList,
  ForumPost,
  ForumPostList,
  ForumMember,
  ForumStats,
  ForumVoteResult,
  SuccessResponse,
} from '@boffmedia/shared';

export type ThreadSort = 'recent' | 'top' | 'new';

export interface ListThreadsParams {
  sort?: ThreadSort;
  page?: number;
  limit?: number;
}

export interface ListPostsParams {
  page?: number;
  limit?: number;
}

export interface CreateThreadInput {
  categoryId: number;
  title: string;
  body: string;
}

export interface CreatePostInput {
  body: string;
}

export interface EditPostInput {
  body: string;
}

export interface SolveThreadInput {
  postId?: number;
}

// Builds a `?a=b&c=d` query string, dropping undefined/null values.
function qs(params: object = {}): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return '';
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
  return search ? `?${search}` : '';
}

export class ForumService {
  // ==================== READ (all @OptionalAuth/@Public) ====================
  // Sent auto-authed: the session token is attached when present (so a member's
  // presence/visibility is honoured) and omitted for anonymous callers.

  static getCategories() {
    return apiAuthedAutoGET<ForumCategory[]>('/forum/categories');
  }

  static getCategory(slug: string) {
    return apiAuthedAutoGET<ForumCategory>(`/forum/categories/${slug}`);
  }

  static getCategoryThreads(slug: string, params: ListThreadsParams = {}) {
    return apiAuthedAutoGET<ForumThreadList>(`/forum/categories/${slug}/threads${qs(params)}`);
  }

  static getThread(id: number) {
    return apiAuthedAutoGET<ForumThread>(`/forum/threads/${id}`);
  }

  static getThreadPosts(id: number, params: ListPostsParams = {}) {
    return apiAuthedAutoGET<ForumPostList>(`/forum/threads/${id}/posts${qs(params)}`);
  }

  static getStats() {
    return apiAuthedAutoGET<ForumStats>('/forum/stats');
  }

  static getOnline() {
    return apiAuthedAutoGET<ForumMember[]>('/forum/online');
  }

  // ==================== WRITE (JWT-guarded) ====================
  // Identity is taken from the session JWT server-side; no write payload carries
  // a userId. Errors surface through the ApiResponse envelope (success=false).

  static createThread(input: CreateThreadInput) {
    return apiAuthedAutoPOST<ForumThread>('/forum/threads', input);
  }

  static createPost(threadId: number, input: CreatePostInput) {
    return apiAuthedAutoPOST<ForumPost>(`/forum/threads/${threadId}/posts`, input);
  }

  static voteThread(threadId: number) {
    return apiAuthedAutoPOST<ForumVoteResult>(`/forum/threads/${threadId}/vote`, {});
  }

  static solveThread(threadId: number, input: SolveThreadInput = {}) {
    return apiAuthedAutoPOST<ForumThread>(`/forum/threads/${threadId}/solve`, input);
  }

  static editPost(postId: number, input: EditPostInput) {
    return apiAuthedAutoPATCH<ForumPost>(`/forum/posts/${postId}`, input);
  }

  static deletePost(postId: number) {
    return apiAuthedAutoDELETE<SuccessResponse>(`/forum/posts/${postId}`);
  }

  static setPinned(threadId: number, pinned: boolean) {
    return apiAuthedAutoPATCH<ForumThread>(`/forum/threads/${threadId}/pin`, { pinned });
  }

  static setLocked(threadId: number, locked: boolean) {
    return apiAuthedAutoPATCH<ForumThread>(`/forum/threads/${threadId}/lock`, { locked });
  }

  // Refreshes the caller's last_seen_at so they appear in the online list.
  static pingPresence() {
    return apiAuthedAutoPOST<SuccessResponse>('/forum/presence/ping', {});
  }
}
