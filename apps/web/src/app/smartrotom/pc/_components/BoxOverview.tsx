"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useBoxGrid, useMons } from "../_hooks/queries"
import { boxDropAttrs, useDragLayer } from "../_hooks/useDrag"
import { usePcUi } from "../_stores/pcUiStore"
import { boxName, boxTheme } from "../_utils/boxMeta"
import { fillTone, THEME_ACCENT, WALLPAPER_CLASS } from "../_utils/boxThemes"
import { POKEMON_PER_BOX } from "../_utils/constants"
import { Bar, Icon, Input, Modal, Sprite } from "./ui"

/**
 * All 30 boxes at once. Every card is a whole-box drop target, so this doubles as the
 * fastest way to file a drag into a far-away box.
 *
 * There is no "new box" tile and no delete: the game server owns exactly 30 boxes and
 * offers no endpoint to add or remove one — a card here would be a lie.
 */
export function BoxOverview({ onClose }: { onClose: () => void }) {
  const t = useTranslations("pc")
  const { mons } = useMons()
  const boxes = useBoxGrid(mons)
  const { drag } = useDragLayer()

  const activeBox = usePcUi((s) => s.activeBox)
  const activeView = usePcUi((s) => s.activeView)
  const setActiveBox = usePcUi((s) => s.setActiveBox)
  const boxMeta = usePcUi((s) => s.boxMeta)

  const [query, setQuery] = useState("")

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return boxes
      .map((contents, i) => ({ contents, i }))
      .filter(({ i }) => !q || boxName(boxMeta, i).toLowerCase().includes(q))
  }, [boxes, boxMeta, query])

  const search = (
    <div className="relative w-[12.5rem] flex-none">
      <Icon
        name="search"
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pc-fg-subtle"
      />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("topbar.searchPlaceholder")}
        aria-label={t("topbar.searchAriaLabel")}
        className="h-[2.375rem] py-0 pl-[2.125rem] pr-3 text-[0.8125rem]"
      />
    </div>
  )

  return (
    <Modal onClose={onClose} title={t("boxOverview.title")} icon="boxes" width={980} headerExtra={search}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-3 p-[1.125rem]">
        {visible.map(({ contents, i }) => {
          const count = contents.filter(Boolean).length
          const accent = THEME_ACCENT[boxTheme(boxMeta, i)]
          const previews = contents.filter((m) => m !== null).slice(0, 5)
          const current = i === activeBox && !activeView
          const over = !!drag?.active && drag.over?.append === true && drag.over.box === i

          return (
            <button
              key={i}
              type="button"
              {...boxDropAttrs(i)}
              onClick={() => {
                setActiveBox(i)
                onClose()
              }}
              aria-label={`${boxName(boxMeta, i)}, ${count} de 30`}
              className={`relative h-[8.25rem] overflow-hidden rounded-[14px] text-left ${
                over
                  ? "border-2 border-pc-green"
                  : current
                    ? "border-2 border-pc-accent"
                    : "border border-pc-line hover:border-pc-line-strong"
              }`}
            >
              <span
                aria-hidden
                className={`pc-wp pc-wp-dots opacity-[.42] ${WALLPAPER_CLASS[boxTheme(boxMeta, i)]}`}
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-pc-bg-1/[.55] to-pc-bg/[.82]"
              />

              <span className="relative z-[1] flex h-full flex-col p-[0.6875rem]">
                <span className="flex items-center gap-[0.4375rem]">
                  <span
                    className="flex h-[1.375rem] w-[1.375rem] flex-none items-center justify-center rounded-md font-pc-mono text-[0.625rem] font-extrabold"
                    style={{
                      background: `${accent}33`,
                      border: `1px solid ${accent}66`,
                      color: accent,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate text-[0.78125rem] font-bold text-pc-fg">
                    {boxName(boxMeta, i)}
                  </span>
                </span>

                <span className="flex flex-1 items-center gap-0.5">
                  {previews.length === 0 ? (
                    <span className="text-[0.6875rem] text-pc-fg-subtle">{t("boxOverview.empty")}</span>
                  ) : (
                    previews.map((m) => (
                      <Sprite
                        key={`${m.loc.box}-${m.loc.index}`}
                        dex={m.pokemon.dex}
                        form={m.pokemon.form}
                        palette={m.pokemon.palette}
                        className="h-[1.625rem] w-[1.625rem] flex-none"
                      />
                    ))
                  )}
                </span>

                <span className="block">
                  <Bar pct={(count / POKEMON_PER_BOX) * 100} tone={fillTone(count)} height={4} />
                  <span className="mt-1 block font-pc-mono text-[0.625rem] text-pc-fg-muted">
                    {count}/30
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
