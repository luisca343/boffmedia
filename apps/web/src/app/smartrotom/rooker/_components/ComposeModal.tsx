"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, Button, CharRing, Icon, MAX_CHARS, Modal, toast } from "./ui"
import { useComposeStore } from "../_stores/composeStore"
import { useCreatePost, useMe } from "../_hooks/queries"

/**
 * Writing a trino.
 *
 * The handoff offered five composer types (texto, captura, combate, media, encuesta).
 * Three ship: **texto**, **media** (a URL — Rooker owns no upload pipeline) and
 * nothing else, because attaching a capture or a battle means picking a specific
 * `rotom_pokedex` / `rotom_replays` row, and the pickers for those are a screen each.
 * The API takes `captureId` / `replayId` today, so the pickers are additive — they do
 * not change the shape of anything already built.
 *
 * [deferred] **Encuesta** (polls) has no table at all and is not offered; a poll button
 * that silently posts plain text would be a lie. Registered in
 * docs/smartrotom/deferred/README.md.
 */
export function ComposeModal() {
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
          toast(replyTo ? "Tu respuesta se publicó." : "Tu trino se publicó en el nido.")
        },
        onError: (err) => toast(err instanceof Error ? err.message : "No se pudo publicar."),
      },
    )
  }

  return (
    <Modal open={open} onClose={close} label={replyTo ? "Responder" : "Crear trino"}>
      <div className="flex items-center justify-between border-b border-rk-line px-3.5 py-3">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="grid h-8 w-8 place-items-center rounded-full text-rk-fg transition-colors hover:bg-rk-hover"
        >
          <Icon name="close" size={20} />
        </button>
        {replyTo?.handle && (
          <span className="text-[13.5px] text-rk-fg-subtle">
            Respondiendo a <span className="text-rk-accent">@{replyTo.handle}</span>
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
              placeholder={replyTo ? "Trina tu respuesta…" : "¿Qué está trinando?"}
              className="w-full resize-none bg-transparent text-[19px] leading-snug text-rk-fg outline-none placeholder:text-rk-fg-subtle"
            />

            {showMedia && (
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Pega el enlace de tu captura de pantalla…"
                aria-label="Enlace de la imagen"
                className="mt-2 w-full rounded-rk-md border border-rk-line-strong bg-rk-card px-3 py-2 text-[14px] text-rk-fg outline-none focus:border-rk-accent"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-rk-line px-4 py-3">
        <button
          type="button"
          onClick={() => setShowMedia((v) => !v)}
          aria-label="Adjuntar imagen"
          aria-pressed={showMedia}
          className={cn(
            "grid h-[34px] w-[34px] place-items-center rounded-full transition-colors hover:bg-rk-accent/12",
            showMedia ? "bg-rk-accent/12 text-rk-accent" : "text-rk-accent",
          )}
        >
          <Icon name="image" size={18} />
        </button>

        <div className="flex items-center gap-3">
          {text.length > 0 && <CharRing count={text.length} />}
          <Button intent="accent" onClick={submit} disabled={blocked}>
            {create.isPending ? "Publicando…" : replyTo ? "Responder" : "Trinar"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
