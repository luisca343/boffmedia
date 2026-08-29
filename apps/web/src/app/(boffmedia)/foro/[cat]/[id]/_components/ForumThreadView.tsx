"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Badge, Button, ConfirmDialog, Empty, Icon, IconButton, Spinner } from "@boffmedia/ui"
import { Byline, fmtNum, ForumComposer, ForumMarkdown } from "@/components/boffmedia/ui/community"
import { useForumThread } from "@/hooks/forum/useForumThread"
import { useForumThreadPosts } from "@/hooks/forum/useForumThreadPosts"
import { useVoteThread } from "@/hooks/forum/useVoteThread"
import { useSetPinned } from "@/hooks/forum/useSetPinned"
import { useSetLocked } from "@/hooks/forum/useSetLocked"
import { useSolveThread } from "@/hooks/forum/useSolveThread"
import { useCreatePost } from "@/hooks/forum/useCreatePost"
import { useEditPost } from "@/hooks/forum/useEditPost"
import { useDeletePost } from "@/hooks/forum/useDeletePost"
import { useBoffSession } from "@/services/useBoffSession"
import { toAuthor } from "../../../_lib/adapters"

const PAGE = 20

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 border border-solid border-bad bg-bad-soft py-2.5 px-3.5 font-mono text-[12px] font-medium text-bad cut-tag cut-tag-edge [--cut-line:var(--bad)]">
      {children}
    </p>
  )
}

export function ForumThreadView({ threadId, cat }: { threadId: number; cat: string }) {
  const t = useTranslations("foro.thread")
  const router = useRouter()
  const [now] = React.useState(() => new Date())
  const [limit, setLimit] = React.useState(PAGE)

  // Vote is server-response-driven: null until the caller toggles, then it holds
  // the { voted, votes } the API returns (there is no separate hasVoted read).
  const [voteState, setVoteState] = React.useState<{ voted: boolean; votes: number } | null>(null)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [replyKey, setReplyKey] = React.useState(0)

  const { session, status, isBoffAdmin } = useBoffSession()
  const loggedIn = status === "authenticated"
  const admin = isBoffAdmin()
  const currentUserId = session?.user?.id

  const { thread, isLoading: threadLoading, error: threadError, refetch: refetchThread } = useForumThread(threadId)
  const { postList, isLoading: postsLoading, refetch: refetchPosts } = useForumThreadPosts(threadId, { limit })

  const { voteThread, isSubmitting: voting } = useVoteThread()
  const { setPinned, isSubmitting: pinning } = useSetPinned()
  const { setLocked, isSubmitting: locking } = useSetLocked()
  const { solveThread, isSubmitting: solving } = useSolveThread()
  const { createPost, isSubmitting: replying, error: replyError } = useCreatePost()
  const { editPost, isSubmitting: editing, error: editError, setError: setEditError } = useEditPost()
  const { deletePost } = useDeletePost()

  if (threadLoading) {
    return (
      <main data-ds="boffmedia" className="wrap grid min-h-[60vh] place-items-center">
        <Spinner />
      </main>
    )
  }

  if (threadError || !thread) {
    return (
      <main data-ds="boffmedia" className="wrap">
        <Empty icon="alert" title={t("notFoundTitle")} lead={t("notFoundLead")}>
          <Button variant="pri" icon="back" href={`/foro/${cat}`}>
            {t("backToCat")}
          </Button>
        </Empty>
      </main>
    )
  }

  const items = postList?.items ?? []
  const total = postList?.total ?? 0

  const displayVotes = voteState?.votes ?? thread.votes
  const hasVoted = voteState?.voted ?? false

  // author or admin gates the solve + per-post write controls; identity is the
  // session user id (string) matched against the numeric forum author id.
  const canSolve = loggedIn && (currentUserId === String(thread.author.id) || admin)
  const canModifyPost = (authorId: number) => loggedIn && (currentUserId === String(authorId) || admin)

  const handleVote = () => {
    if (!loggedIn) {
      router.push("/entrar")
      return
    }
    const prev = { voted: hasVoted, votes: displayVotes }
    // Optimistic toggle, then reconcile to whatever the server reports.
    setVoteState({ voted: !prev.voted, votes: Math.max(0, prev.votes + (prev.voted ? -1 : 1)) })
    voteThread(thread.id).then((res) => setVoteState(res ?? prev))
  }

  const handleTogglePin = () => {
    setPinned(thread.id, !thread.pinned).then((t) => {
      if (t) refetchThread()
    })
  }

  const handleToggleLock = () => {
    setLocked(thread.id, !thread.locked).then((t) => {
      if (t) refetchThread()
    })
  }

  const handleSolve = (postId: number) => {
    solveThread(thread.id, { postId }).then((t) => {
      if (t) {
        refetchThread()
        refetchPosts()
      }
    })
  }

  const handleUnsolve = () => {
    solveThread(thread.id, {}).then((t) => {
      if (t) {
        refetchThread()
        refetchPosts()
      }
    })
  }

  const handleReply = (v: { body: string }) => {
    createPost(thread.id, { body: v.body }).then((created) => {
      if (created) {
        setReplyKey((k) => k + 1)
        refetchPosts()
        refetchThread()
      }
    })
  }

  const handleEdit = (postId: number, body: string) => {
    editPost(postId, { body }).then((updated) => {
      if (updated) {
        setEditingId(null)
        refetchPosts()
      }
    })
  }

  // Holds the post awaiting confirmation, so the dialog knows what it is about
  // to delete and no row has to keep state of its own.
  const [pendingDelete, setPendingDelete] = React.useState<number | null>(null)
  const handleDelete = (postId: number) => setPendingDelete(postId)
  const confirmDelete = () => {
    const postId = pendingDelete
    setPendingDelete(null)
    if (postId == null) return
    deletePost(postId).then((res) => {
      if (res) {
        refetchThread()
        refetchPosts()
      }
    })
  }

  return (
    <main data-ds="boffmedia" className="wrap pb-[90px] pt-6">
      <nav className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim">
        <Link href="/foro" className="no-underline transition-colors hover:text-txt">
          {t("breadcrumb")}
        </Link>
        <span className="text-line-2">›</span>
        <Link href={`/foro/${thread.catSlug}`} className="no-underline transition-colors hover:text-txt">
          {thread.catName}
        </Link>
        <span className="text-line-2">›</span>
        <span className="min-w-0 truncate text-txt-muted">{thread.title}</span>
      </nav>

      <header className="mb-6 border-b border-solid border-line pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          {thread.pinned && <Badge tone="new">{t("pinned")}</Badge>}
          {thread.locked && (
            <Badge>
              <span className="inline-flex items-center gap-1">
                <Icon name="lock" size={11} /> {t("locked")}
              </span>
            </Badge>
          )}
          {thread.solved && <Badge tone="ok">{t("solved")}</Badge>}
        </div>
        <h1 className="text-[clamp(28px,4vw,42px)]">{thread.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Byline author={toAuthor(thread.author)} when={thread.createdAt} now={now} link={false} />
          <span className="flex items-center gap-4 font-mono text-[11px]/none font-medium uppercase tracking-[0.08em] text-txt-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="list" size={13} className="text-accent" /> {t("repliesCount", { count: thread.replies })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="eye" size={13} className="text-accent" /> {t("viewsCount", { count: fmtNum(thread.views) })}
            </span>
          </span>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={handleVote}
              disabled={voting}
              aria-pressed={hasVoted}
              className={cn(
                "inline-flex items-center gap-2 border border-solid py-[9px] px-3.5 cut-tag cut-tag-edge font-mono text-[12px] font-semibold uppercase tracking-[0.08em]",
                "transition-[color,border-color,background] duration-[140ms]",
                hasVoted
                  ? "border-accent [--cut-line:var(--accent)] bg-accent-soft text-accent"
                  : "border-line-2 [--cut-line:var(--line-2)] text-txt-muted hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-accent-bright",
                voting && "opacity-60 pointer-events-none",
              )}
            >
              <Icon name="trending" size={14} />
              <span className="tabular-nums">{fmtNum(displayVotes)}</span>
              <span>{hasVoted ? t("voted") : t("vote")}</span>
            </button>

            {admin && (
              <>
                <Button size="sm" icon="bookmark" onClick={handleTogglePin} loading={pinning}>
                  {thread.pinned ? t("unpin") : t("pin")}
                </Button>
                <Button size="sm" icon="lock" onClick={handleToggleLock} loading={locking}>
                  {thread.locked ? t("reopen") : t("close")}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {postsLoading && !postList ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <Empty icon="mail" title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((post) => {
              const isEditing = editingId === post.id
              const editable = canModifyPost(post.author.id)
              const showSolveMark = canSolve && !post.isOp && !post.isSolution
              const showUnsolve = canSolve && post.isSolution
              const showFooter = !isEditing && (editable || showSolveMark || showUnsolve)

              return (
                <article
                  key={post.id}
                  className={cn(
                    "border border-solid border-line bg-panel p-5 cut-corner cut-corner-edge [--cut-line:var(--line)]",
                    post.isSolution && "border-accent-line border-l-4 border-l-accent",
                  )}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-solid border-line pb-3">
                    <Byline author={toAuthor(post.author)} when={post.createdAt} now={now} link={false} />
                    <span className="flex items-center gap-2">
                      {post.isOp && <Badge tone="new">{t("op")}</Badge>}
                      {post.isSolution && <Badge tone="ok">{t("solution")}</Badge>}
                    </span>
                  </div>

                  {isEditing ? (
                    <div>
                      {editError && <ErrorNote>{editError}</ErrorNote>}
                      <ForumComposer
                        initialBody={post.body}
                        submitLabel={t("save")}
                        busy={editing}
                        onSubmit={(v) => handleEdit(post.id, v.body)}
                        onCancel={() => {
                          setEditError(null)
                          setEditingId(null)
                        }}
                      />
                    </div>
                  ) : (
                    <ForumMarkdown>{post.body}</ForumMarkdown>
                  )}

                  {showFooter && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-solid border-line pt-3">
                      {showSolveMark && (
                        <Button size="sm" icon="check" onClick={() => handleSolve(post.id)} loading={solving}>
                          {t("markSolution")}
                        </Button>
                      )}
                      {showUnsolve && (
                        <Button size="sm" icon="x" onClick={handleUnsolve} loading={solving}>
                          {t("unmarkSolution")}
                        </Button>
                      )}
                      {editable && (
                        <span className="ml-auto flex items-center gap-2">
                          <IconButton
                            name="edit"
                            label={t("edit")}
                            size="sm"
                            onClick={() => {
                              setEditError(null)
                              setEditingId(post.id)
                            }}
                          />
                          {!post.isOp && (
                            <IconButton
                              name="trash"
                              label={t("delete")}
                              size="sm"
                              className="hover:border-bad hover:text-bad"
                              onClick={() => handleDelete(post.id)}
                            />
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {items.length < total && (
            <div className="mt-5 flex justify-center">
              <Button icon="chevronDown" onClick={() => setLimit((l) => l + PAGE)}>
                {t("loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      {thread.locked ? (
        <div className="mt-8 flex items-center justify-center gap-2 border border-solid border-line bg-panel-2 py-4 px-5 cut-corner cut-corner-edge font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-txt-muted">
          <Icon name="lock" size={14} /> {t("closedNotice")}
        </div>
      ) : loggedIn ? (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-[18px] font-bold uppercase not-italic tracking-[0.03em] text-txt">{t("replyTitle")}</h2>
          {replyError && <ErrorNote>{replyError}</ErrorNote>}
          <ForumComposer key={replyKey} submitLabel={t("replySubmit")} busy={replying} onSubmit={handleReply} />
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border border-solid border-line bg-panel py-5 px-5 cut-corner cut-corner-edge text-center">
          <span className="font-body text-[14px] text-txt-muted">{t("joinConversation")}</span>
          <Button variant="pri" size="sm" icon="user" href="/entrar">
            {t("loginToReply")}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        tone="error"
        title={t("confirmDeleteTitle")}
        body={t("confirmDelete")}
        confirmLabel={t("delete")}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </main>
  )
}
