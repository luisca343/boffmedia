import { Avatar, I } from "@/components/smartrotom/media/ui"
import type { YtComment } from "../../_services/youtubeService"
import { formatCount, relativeTime } from "../../_utils/youtube"

function Comment({ c }: { c: YtComment }) {
  return (
    <div className="flex gap-3 border-b border-mw-line py-3">
      <Avatar src={c.authorAvatar} name={c.author} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-mw-fg-mute">
          <strong className="text-[13px] text-mw-fg">{c.author}</strong>
          <span>{relativeTime(c.publishedAt)}</span>
        </div>
        <p className="my-1.5 whitespace-pre-line text-sm leading-[1.55] text-mw-fg">{c.text}</p>
        <div className="mt-1 flex gap-1 text-mw-fg-mute">
          <span className="inline-flex items-center gap-1 rounded-mw-pill px-2 py-1 text-xs">
            <I.thumbUp size={14} /> {formatCount(c.likes)}
          </span>
          {c.replyCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-mw-accent">
              <I.chevron size={12} /> {c.replyCount} respuestas
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** Real comment threads. Gracefully empty when comments are disabled/quota. */
export function Comments({ comments, loading }: { comments: YtComment[]; loading?: boolean }) {
  if (loading) return <p className="py-6 text-sm text-mw-fg-faint">Cargando comentarios…</p>
  if (comments.length === 0) {
    return <p className="py-6 text-sm text-mw-fg-faint">No hay comentarios disponibles.</p>
  }
  return (
    <div className="mt-6">
      <h3 className="mb-4 font-mw-display text-xl">{formatCount(comments.length)} comentarios</h3>
      {/* compose bar deferred — needs Google OAuth to post (§13) */}
      {comments.map((c) => (
        <Comment key={c.id} c={c} />
      ))}
    </div>
  )
}
