"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useBoxGrid, useMons } from "../_hooks/queries"
import { usePcUi } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { boxName, boxTheme } from "../_utils/boxMeta"
import { WALLPAPER_CLASS } from "../_utils/boxThemes"
import { POKEMON_PER_BOX } from "../_utils/constants"
import { displayName, isShiny } from "../_utils/derive"
import { Button, Icon, Modal, Sprite, Textarea, toast } from "./ui"

/** `btoa` only speaks latin-1, and a nickname can be anything. UTF-8 first, then base64. */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

/** Copying is client-only: the async clipboard first, a hidden textarea when it is blocked. */
function copyText(text: string, label: string, errorMsg: string): void {
  const done = () => toast(`${label}`, "success")
  const fallback = () => {
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      done()
    } catch {
      toast(errorMsg, "error")
    }
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done, fallback)
    return
  }
  fallback()
}

export interface ShareBoxProps {
  box: number
  onClose: () => void
}

export function ShareBox({ box, onClose }: ShareBoxProps) {
  const t = useTranslations("pc")
  const { mons } = useMons()
  const boxes = useBoxGrid(mons)
  const boxMeta = usePcUi((s) => s.boxMeta)

  const slots = useMemo(() => boxes[box] ?? [], [boxes, box])
  const name = boxName(boxMeta, box)
  const theme = boxTheme(boxMeta, box)
  const filled = useMemo(() => slots.filter((m): m is Mon => !!m), [slots])
  const shinies = filled.filter((m) => isShiny(m.pokemon)).length

  const code = useMemo(() => {
    const payload = {
      v: 1,
      n: name,
      t: theme,
      p: filled.map((m) => [m.pokemon.dex, m.pokemon.level, isShiny(m.pokemon) ? 1 : 0]),
    }
    try {
      return `SRPC1.${toBase64(JSON.stringify(payload))}`
    } catch {
      return "SRPC1."
    }
  }, [name, theme, filled])

  const summary = useMemo(() => {
    const lines = [`📦 ${name} — ${filled.length}/${POKEMON_PER_BOX}`]
    for (const m of filled) {
      const p = m.pokemon
      lines.push(
        `#${String(p.dex).padStart(3, "0")} ${displayName(p)}${isShiny(p) ? " ✨" : ""} · Nv${p.level}`,
      )
    }
    return lines.join("\n")
  }, [name, filled])

  return (
    <Modal
      onClose={onClose}
      title={t("share.title")}
      subtitle={`${name} · ${filled.length} Pokémon${shinies ? ` · ${shinies} ${t("filters.statusToggles.shiny")}` : ""}`}
      icon="share"
      tone="text-pc-cyan"
      width={560}
    >
      <div className="flex flex-col gap-4 p-[18px]">
        <div className="relative overflow-hidden rounded-[14px] border border-pc-line">
          <span className={`pc-wp pc-wp-dots ${WALLPAPER_CLASS[theme]}`} />
          <div className="relative z-10 grid grid-cols-10 gap-[5px] p-3.5">
            {Array.from({ length: POKEMON_PER_BOX }, (_, i) => slots[i] ?? null).map((m, i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-md border border-pc-line bg-[rgb(8_12_22_/_.4)]"
              >
                {m && (
                  <Sprite
                    dex={m.pokemon.dex}
                    form={m.pokemon.form}
                    palette={m.pokemon.palette}
                    className="h-[88%] w-[88%]"
                    alt={displayName(m.pokemon)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-[7px]">
            <Icon name="copy" size={14} className="text-pc-accent" />
            <h3 className="text-[13px] font-bold">{t("share.code")}</h3>
          </div>
          <div className="flex gap-2">
            <Textarea
              readOnly
              value={code}
              aria-label={t("share.code")}
              onFocus={(e) => e.target.select()}
              className="h-16 flex-1 font-pc-mono"
              // The shared field's font-size and `resize-y` are emitted after any
              // utility we could add here, so the code block sets them inline to win.
              style={{ fontSize: 11, lineHeight: 1.5, resize: "none" }}
            />
            <Button variant="primary" aria-label={t("share.code")} onClick={() => copyText(code, t("share.copied"), t("share.copyError"))}>
              <Icon name="copy" size={15} />
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-pc-fg-subtle">
            {t("share.hint")}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-[7px]">
            <Icon name="list" size={14} className="text-pc-accent" />
            <h3 className="text-[13px] font-bold">{t("share.summary")}</h3>
          </div>
          <div className="flex gap-2">
            <Textarea
              readOnly
              value={summary}
              aria-label={t("share.summary")}
              onFocus={(e) => e.target.select()}
              className="h-[120px] flex-1 font-pc-mono"
              style={{ fontSize: 11.5, lineHeight: 1.5, resize: "none" }}
            />
            <Button aria-label={t("share.summary")} onClick={() => copyText(summary, t("share.summaryCopied"), t("share.copyError"))}>
              <Icon name="copy" size={15} />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
