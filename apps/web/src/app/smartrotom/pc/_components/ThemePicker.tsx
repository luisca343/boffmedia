"use client"

import { useTranslations } from "next-intl"
import { usePcUi } from "../_stores/pcUiStore"
import { boxName, boxTheme } from "../_utils/boxMeta"
import { BOX_THEMES, THEME_LABEL, WALLPAPER_CLASS } from "../_utils/boxThemes"
import { Modal } from "./ui"

export interface ThemePickerProps {
  box: number
  onClose: () => void
}

/** The ten wallpapers. Cosmetic, per-device — see `_utils/boxMeta.ts`. */
export function ThemePicker({ box, onClose }: ThemePickerProps) {
  const t = useTranslations("pc")
  const boxMeta = usePcUi((s) => s.boxMeta)
  const setBoxTheme = usePcUi((s) => s.setBoxTheme)
  const current = boxTheme(boxMeta, box)

  return (
    <Modal onClose={onClose} title={t("themes.title", { box: boxName(boxMeta, box) })} icon="palette" width={420}>
      <div className="grid grid-cols-5 gap-2.5 p-5">
        {BOX_THEMES.map((theme) => {
          const selected = theme === current
          return (
            <button
              key={theme}
              type="button"
              aria-pressed={selected}
              aria-label={t(`themes.${theme}`)}
              onClick={() => {
                setBoxTheme(box, theme)
                onClose()
              }}
              className={`relative h-16 overflow-hidden rounded-xl ${
                selected ? "border-2 border-pc-accent" : "border border-pc-line hover:border-pc-line-strong"
              }`}
            >
              <span aria-hidden className={`pc-wp pc-wp-dots ${WALLPAPER_CLASS[theme]}`} />
              <span className="absolute inset-x-0 bottom-1 z-[1] text-center text-[10px] font-semibold text-pc-fg [text-shadow:0_1px_3px_#000]">
                {t(`themes.${theme}`)}
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
