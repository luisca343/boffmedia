"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives/icon"

// v3 «Señal» — MH Wilds shared shell: persistent tool tabs + global favourite
// star. Prefix mh-tabs-shell / mh-favstar in mh-shell.css. The favourites store
// (mh_favs_v1) isn't wired locally — MhFavStar toggles its own state. [deferred]

const MH_TABS: { key: string; route: string; label: string; icon: IconName }[] = [
  { key: "monsters", route: "/herramientas/mhwilds/monsters", label: "Bestiario", icon: "skull" },
  { key: "armas", route: "/herramientas/mhwilds/armas", label: "Armas", icon: "sword" },
  { key: "armor", route: "/herramientas/mhwilds/armor", label: "Armadura", icon: "shield" },
  { key: "planner", route: "/herramientas/mhwilds/builds/planner", label: "Planner", icon: "target" },
  { key: "caza", route: "/herramientas/mhwilds/caza", label: "Caza", icon: "hammer" },
  { key: "dano", route: "/herramientas/mhwilds/dano", label: "Daño", icon: "crosshair" },
]

export function MhToolTabs({ go, active, onOpenFavs, favCount = 0 }: { go?: (route: string) => void; active?: string; onOpenFavs?: () => void; favCount?: number }) {
  return (
    <div className="flex min-h-[46px] items-stretch gap-1 border-b border-solid border-line bg-base-2 px-[clamp(10px,2vw,24px)]" role="tablist" aria-label="Herramientas de Monster Hunter Wilds">
      <button type="button" title="Volver a MH Wilds" onClick={() => go && go("/herramientas/mhwilds")} className="group mr-1.5 flex items-center gap-[9px] border-0 border-r border-solid border-line bg-transparent pr-4 cursor-pointer">
        <span className="grid h-[26px] w-[26px] flex-none place-items-center border border-solid border-[color:var(--mh-line)] bg-[var(--mh-soft)] text-[color:var(--mh-bright)] [clip-path:polygon(0_0,calc(100%_-_6px)_0,100%_6px,100%_100%,6px_100%,0_calc(100%_-_6px))]">
          <Icon name="skull" size={15} />
        </span>
        <span className="font-display text-[15px]/none font-extrabold uppercase tracking-[0.03em] text-txt group-hover:text-[color:var(--mh-bright)] max-[640px]:hidden">
          MH<em className="not-italic text-[color:var(--mh-bright)]">Wilds</em>
        </span>
      </button>
      <div className="flex flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MH_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => go && go(t.route)}
            className={cn("inline-flex flex-none items-center gap-[7px] whitespace-nowrap border-0 border-b-2 border-solid border-transparent bg-transparent px-[15px] font-mono text-[12.5px]/none font-semibold tracking-[0.02em] transition-[color,border-color,background] duration-[140ms]", active === t.key ? "border-b-[color:var(--mh-bright)] text-[color:var(--mh-bright)]" : "text-txt-muted hover:bg-panel hover:text-txt")}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={onOpenFavs} title="Favoritos" className={cn("relative ml-1.5 inline-flex h-8 flex-none items-center gap-[7px] self-center border border-solid bg-panel px-3 font-mono text-[12px]/none font-semibold tracking-[0.02em] transition-[color,border-color] duration-[140ms]", favCount ? "border-[hsl(45_90%_60%/0.4)] text-[#ffcf5c]" : "border-line text-txt-muted hover:border-line-2 hover:text-txt")}>
        <Icon name="star" size={15} />
        <span className="max-[640px]:hidden">Favoritos</span>
        {favCount > 0 && <span className="inline-grid h-[17px] min-w-[17px] place-items-center bg-[var(--mh)] px-1 font-mono text-[10px]/none font-bold text-[#05130c] [border-radius:9px]">{favCount}</span>}
      </button>
    </div>
  )
}

export function MhFavStar({ type, id, label, meta, size = 15, defaultOn = false }: { type: string; id: string; label?: string; meta?: string; size?: number; defaultOn?: boolean }) {
  const [on, setOn] = React.useState(defaultOn)
  return (
    <button
      type="button"
      aria-pressed={on}
      title={on ? "Quitar de favoritos" : "Añadir a favoritos"}
      onClick={(e) => {
        e.stopPropagation()
        setOn((v) => !v)
      }}
      className={cn("grid h-[34px] w-[34px] flex-none place-items-center border border-solid bg-panel transition-[color,border-color,background] duration-[140ms]", on ? "border-[hsl(45_90%_60%/0.45)] bg-[hsl(45_90%_60%/0.1)] text-[#ffcf5c]" : "border-line text-txt-dim hover:border-line-2 hover:text-[#ffcf5c]")}
    >
      <Icon name="star" size={size} className={on ? "fill-current" : undefined} />
    </button>
  )
}
