"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useMons } from "../_hooks/queries"
import { locId, usePcUi } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { displayName } from "../_utils/derive"
import { ComparePanel } from "./ComparePanel"
import { Button, Icon, Panel, Sprite } from "./ui"

/**
 * The floating comparison tray. The store holds `locId`s rather than content hashes:
 * two identical clones share a hash, and "compare this one" has to mean the one the
 * user clicked.
 */
export function CompareTray() {
  const t = useTranslations("pc")
  const [open, setOpen] = useState(false)
  const compare = usePcUi((s) => s.compare)
  const setCompare = usePcUi((s) => s.setCompare)
  const { mons } = useMons()

  const picked = useMemo(() => {
    const byLoc = new Map<string, Mon>()
    for (const m of mons) byLoc.set(locId(m.loc), m)
    return compare
      .map((id) => byLoc.get(id))
      .filter((m): m is Mon => m !== undefined)
  }, [compare, mons])

  if (picked.length === 0) return null

  const remove = (id: string) => setCompare(compare.filter((x) => x !== id))

  return (
    <>
      <Panel className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 animate-pc-slide-up items-center gap-3 !rounded-pc-pill py-2 pl-4 pr-2 shadow-[0_18px_50px_-18px_rgb(0_0_0_/_.75)] motion-reduce:animate-none">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-pc-violet">
          <Icon name="layers" size={14} />
          {t("compare.title")} {picked.length}
        </span>

        <div className="flex gap-1">
          {picked.map((m) => {
            const id = locId(m.loc)
            return (
              <div key={id} className="relative h-9 w-9 rounded-lg bg-white/5">
                <Sprite
                  dex={m.pokemon.dex}
                  form={m.pokemon.form}
                  palette={m.pokemon.palette}
                  className="h-full w-full"
                />
                <button
                  type="button"
                  aria-label={`${t("compare.title")} ${displayName(m.pokemon)}`}
                  onClick={() => remove(id)}
                  className="absolute -right-[5px] -top-[5px] flex h-4 w-4 items-center justify-center rounded-pc-pill bg-pc-rose text-white focus-visible:outline-none"
                >
                  <Icon name="x" size={10} stroke={3} />
                </button>
              </div>
            )
          })}
        </div>

        <Button variant="primary" disabled={picked.length < 2} onClick={() => setOpen(true)}>
          {t("common.apply")}
        </Button>
        <Button variant="ghost" icon aria-label={t("compare.empty")} onClick={() => setCompare([])}>
          <Icon name="x" size={16} />
        </Button>
      </Panel>

      {open && picked.length >= 2 && <ComparePanel mons={picked} onClose={() => setOpen(false)} />}
    </>
  )
}
