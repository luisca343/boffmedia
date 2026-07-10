import { CmTone, ForumAuthor } from './entities/forum-author.entity';

// Deterministic tone per user: same id always resolves to the same colour.
const AUTHOR_TONES: CmTone[] = ['orange', 'accent', 'emerald', 'purple'];

/**
 * Public author projection from a BoffMedia user. The avatar is a single
 * uppercased initial (the UI renders it as a tinted text glyph). Role is a
 * static label for v1 — admin distinction is deferred.
 */
export function toForumAuthor(user: {
  id: number;
  username: string;
  profilePicture?: string | null;
}): ForumAuthor {
  const name = user.username ?? '';
  return {
    id: user.id,
    name,
    handle: name,
    avatar: (name.charAt(0) || '?').toUpperCase(),
    avatarUrl: user.profilePicture ?? null,
    tone: AUTHOR_TONES[user.id % 4],
    role: 'Miembro',
  };
}
