import type { IconName } from "@boffmedia/ui"
import type {
  CmAuthor,
  CmTone,
  ForumCategoryLike,
  ForumMember as CmForumMember,
  ForumThreadLike,
} from "@/components/boffmedia/ui/community"
import type { ForumAuthor, ForumCategory, ForumMember, ForumThread } from "@boffmedia/shared"

// The forum API entities are structurally close to the fo-* «*Like» props, but
// the generated types widen a few fields (icon/tone/status are backed by string
// enums server-side). These adapters normalise them to the exact union types the
// reused components expect, keeping the views cast-free.

function toTone(tone: unknown): CmTone {
  return String(tone) as CmTone
}

export function toAuthor(a: ForumAuthor): CmAuthor {
  return { id: a.id, name: a.name, handle: a.handle, avatar: a.avatar, avatarUrl: a.avatarUrl, tone: toTone(a.tone), role: a.role }
}

export function toAuthorOrNull(a: ForumAuthor | null | undefined): CmAuthor | null {
  return a ? toAuthor(a) : null
}

export function toCategoryLike(c: ForumCategory): ForumCategoryLike {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    icon: c.icon as IconName,
    hue: c.hue,
    locked: c.locked,
    threads: c.threads,
    posts: c.posts,
    lastAuthor: toAuthorOrNull(c.lastAuthor),
    lastAt: c.lastAt ?? null,
  }
}

export function toThreadLike(t: ForumThread): ForumThreadLike {
  return {
    id: t.id,
    catSlug: t.catSlug,
    catName: t.catName,
    catHue: t.catHue,
    title: t.title,
    author: toAuthor(t.author),
    lastAuthor: toAuthorOrNull(t.lastAuthor),
    lastAt: t.lastAt ?? null,
    createdAt: t.createdAt,
    pinned: t.pinned,
    locked: t.locked,
    solved: t.solved,
    replies: t.replies,
    views: t.views,
    votes: t.votes,
  }
}

export function toMemberLike(m: ForumMember): CmForumMember {
  return { ...toAuthor(m), status: String(m.status) as CmForumMember["status"] }
}
