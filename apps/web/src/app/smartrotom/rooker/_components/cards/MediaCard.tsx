"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Icon } from "../ui"

/**
 * An image attached to a trino.
 *
 * `mediaUrl` is whatever the poster pasted — in practice a ShareX upload from the
 * server's own gallery. There is no upload pipeline in Rooker itself, so this renders a
 * URL rather than owning storage; a broken or dead link degrades to a caption instead
 * of a torn-image glyph, because a timeline full of broken images is worse than one
 * with a missing picture.
 *
 * 16:9 and `object-cover`, so a portrait screenshot and a wide one both sit in the same
 * rhythm down the column.
 */
export function MediaCard({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  const t = useTranslations("rooker")

  if (failed) {
    return (
      <div className="flex aspect-video items-center justify-center gap-2 rounded-rk border border-rk-line bg-rk-card text-[0.8125rem] text-rk-fg-subtle">
        <Icon name="image" size={16} />
        {t("card.media.unavailable")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-rk border border-rk-line bg-rk-card">
      <img
        src={url}
        alt={t("card.media.alt")}
        loading="lazy"
        onError={() => setFailed(true)}
        className="aspect-video w-full object-cover"
      />
    </div>
  )
}
