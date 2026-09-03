"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { userMessageFrom } from "@/services/boffAPI"
import { Avatar, Button, CharRing, Icon, MAX_CHARS, Modal, toast } from "./ui"
import { useComposeStore } from "../_stores/composeStore"
import { useCreatePost, useMe } from "../_hooks/queries"

/**
 * Writing a trino.
 *
 * Two composer types ship: **texto** and **media** (a URL — Rooker owns no upload
 * pipeline). Attaching a capture or a battle means picking a specific `rotom_pokedex` /
 * `rotom_replays` row, and the pickers for those are a screen each. The API already
 * takes `captureId` / `replayId`, so adding them later is additive — it does not change
 * the shape of anything already built.
 *
 * [deferred] **Encuesta** (polls) has no table at all and is not offered; a poll button
 * that silently posts plain text would be a lie. Registered in
 * docs/smartrotom/deferred/README.md.
 */
export function ComposeModal() {
  const t = useTranslations("rooker")
  const { open, replyTo, close } = useComposeStore()
  const { data: me } = useMe()
  const create = useCreatePost()

  const [text, setText] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [showMedia, setShowMedia] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  // A fresh dialog every time: reopening with the last draft still in it is how you
  // accidentally post a reply to the wrong trino.
  useEffect(() => {
    if (open) {
      setText("")
      setMediaUrl("")
      setShowMedia(false)
      ref.current?.focus()
    }
  }, [open])

  const over = text.length > MAX_CHARS
  const empty = text.trim().length === 0 && !mediaUrl.trim()
  const blocked = over || empty || create.isPending

  const submit = () => {
    if (blocked) return
    create.mutate(
      {
        text: text.trim() || undefined,
        type: mediaUrl.trim() ? "media" : "text",
        mediaUrl: mediaUrl.trim() || undefined,
        parentId: replyTo?.id,
      },
      {
        onSuccess: () => {
          close()
          toast(replyTo ? t("toast.replyPublished") : t("toast.postPublished"))
        },
        onError: (err) => toast(userMessageFrom(err, t("toast.publishFailed"))),
      },
    )
  }

  return (
    <Modal open={open} onClose={close} label={replyTo ? t("compose.dialogTitle.reply") : t("compose.dialogTitle.new")}>
      <div className="flex items-center justify-between border-b border-rk-line px-3.5 py-3">
        <button
          type="button"
          onClick={close}
          aria-label={t("common.close")}
          className="grid h-8 w-8 place-items-center rounded-full text-rk-fg transition-colors hover:bg-rk-hover"
        >
          <Icon name="close" size={20} />
        </button>
        {replyTo?.handle && (
          <span className="text-[0.84375rem] text-rk-fg-subtle">
            {t("compose.replyingToPrefix")} <span className="text-rk-accent">@{replyTo.handle}</span>
          </span>
        )}
        <span className="w-8" />
      </div>

      <div className="px-4 py-3.5">
        <div className="flex gap-3">
          {me && (
            <Avatar
              user={{ uuid: me.uuid, username: me.username, partnerPokemonId: me.partnerPokemonId }}
              size={46}
            />
          )}
          <div className="min-w-0 flex-1">
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl/⌘+Enter posts — the shortcut every composer has, and the reason
                // the button is not the only way out of this dialog.
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit()
              }}
              rows={3}
              placeholder={replyTo ? t("compose.placeholder.reply") : t("compose.placeholder.new")}
              className="w-full resize-none bg-transparent text-[1.1875rem] leading-snug text-rk-fg outline-none placeholder:text-rk-fg-subtle"
            />

            {showMedia && (
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={t("compose.mediaPlaceholder")}
                aria-label={t("compose.mediaAriaLabel")}
                className="mt-2 w-full rounded-rk-md border border-rk-line-strong bg-rk-card px-3 py-2 text-[0.875rem] text-rk-fg outline-none focus:border-rk-accent"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-rk-line px-4 py-3">
        <button
          type="button"
          onClick={() => setShowMedia((v) => !v)}
          aria-label={t("compose.attachImageAriaLabel")}
          aria-pressed={showMedia}
          className={cn(
            "grid h-[2.125rem] w-[2.125rem] place-items-center rounded-full transition-colors hover:bg-rk-accent/12",
            showMedia ? "bg-rk-accent/12 text-rk-accent" : "text-rk-accent",
          )}
        >
          <Icon name="image" size={18} />
        </button>

        <div className="flex items-center gap-3">
          {text.length > 0 && <CharRing count={text.length} />}
          <Button intent="accent" onClick={submit} disabled={blocked}>
            {create.isPending ? t("compose.pending") : replyTo ? t("post.actions.reply") : t("compose.submit")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
