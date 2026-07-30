"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Input, Textarea, Seg } from "@boffmedia/ui"
import { ForumMarkdown } from "./ForumMarkdown"

// Matches the forum write DTOs (create-thread / create-post / edit-post).
const TITLE_MIN = 3
const TITLE_MAX = 200
const BODY_MIN = 1
const BODY_MAX = 20000

export interface ForumComposerValue {
  title?: string
  body: string
}

export interface ForumComposerProps {
  withTitle?: boolean
  initialTitle?: string
  initialBody?: string
  submitLabel: string
  busy?: boolean
  onSubmit: (value: ForumComposerValue) => void
  onCancel?: () => void
}

// Markdown composer used across the forum write UI: an Escribir | Vista previa
// tab pair (preview renders through ForumMarkdown), a mono textarea, an optional
// title field, and a submit that enforces the DTO length bounds before firing.
export function ForumComposer({
  withTitle = false,
  initialTitle = "",
  initialBody = "",
  submitLabel,
  busy = false,
  onSubmit,
  onCancel,
}: ForumComposerProps) {
  const t = useTranslations("common.forum")
  const [tab, setTab] = React.useState<"write" | "preview">("write")
  const [title, setTitle] = React.useState(initialTitle)
  const [body, setBody] = React.useState(initialBody)

  const titleTrimmed = title.trim()
  const bodyTrimmed = body.trim()

  const titleOk = !withTitle || (titleTrimmed.length >= TITLE_MIN && titleTrimmed.length <= TITLE_MAX)
  const bodyOk = bodyTrimmed.length >= BODY_MIN && body.length <= BODY_MAX
  const canSubmit = titleOk && bodyOk && !busy

  const submit = () => {
    if (!canSubmit) return
    onSubmit(withTitle ? { title: titleTrimmed, body: bodyTrimmed } : { body: bodyTrimmed })
  }

  const titleTooShort = withTitle && titleTrimmed.length > 0 && titleTrimmed.length < TITLE_MIN

  return (
    <div className="border border-solid border-line bg-panel p-4 cut-corner">
      {withTitle && (
        <div className="mb-3">
          <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-txt-muted">
            {t("title")}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder={t("titlePlaceholder")}
            disabled={busy}
          />
        </div>
      )}

      <div className="mb-2.5 flex items-center justify-between gap-3">
        <Seg
          options={[
            { value: "write", label: t("write") },
            { value: "preview", label: t("preview") },
          ]}
          value={tab}
          onChange={(v) => setTab(v as "write" | "preview")}
        />
        <span className="font-mono text-[11px] font-medium tabular-nums text-txt-dim">
          {body.length}/{BODY_MAX}
        </span>
      </div>

      {tab === "write" ? (
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          placeholder={t("messagePlaceholder")}
          disabled={busy}
          className="min-h-[160px] font-mono text-[13px]/[1.6]"
        />
      ) : (
        <div className="min-h-[160px] border border-solid border-line-2 bg-panel-2 p-4 cut-tag">
          {bodyTrimmed ? (
            <ForumMarkdown>{body}</ForumMarkdown>
          ) : (
            <p className="font-body text-[14px] italic text-txt-dim">{t("nothingToPreview")}</p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Button variant="pri" icon="check" onClick={submit} disabled={!canSubmit} loading={busy}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t("cancel")}
          </Button>
        )}
        <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-txt-dim">
          {titleTooShort ? t("titleMinChars") : t("supportsMarkdown")}
        </span>
      </div>
    </div>
  )
}
