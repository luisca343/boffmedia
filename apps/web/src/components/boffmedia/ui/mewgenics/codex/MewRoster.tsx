"use client"

import * as React from "react"
import { ChipGroup, Empty, Icon, SearchInput, Select } from "@/components/boffmedia/primitives"
import { CxCard } from "../MewPop"
import { MewData } from "../mew-store"
import { CX_CAP, CX_SORT } from "./codex-config"
import type { MewCodexModel } from "./useMewCodex"

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-b-[2.5px] border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-[5px] py-0.5 font-mono text-[10px]/none text-[color:var(--mwp-cream)] [border-radius:5px]">{children}</kbd>
}

/** The searchable/filterable roster rail. Pure presenter of the codex model. */
export function MewRoster({ codex }: { codex: MewCodexModel }) {
  const { cat, catDef, q, setQ, view, setView, sort, setSort, filters, setFilters, filterOpts, filtered, shown, selId, rosterOpen, abilitiesLoading, scrollRef, pick } = codex
  return (
    <aside className={"mew-roster flex min-h-0 flex-col border-r-2 border-solid border-[color:var(--mwp-nline)] bg-[rgba(0,0,0,0.16)] max-[760px]:fixed max-[760px]:inset-y-0 max-[760px]:left-0 max-[760px]:z-[60] max-[760px]:w-[min(348px,88vw)] max-[760px]:bg-[color:var(--mwp-night-2)] max-[760px]:shadow-[12px_0_40px_rgba(0,0,0,0.5)] max-[760px]:transition-transform " + (rosterOpen ? "max-[760px]:translate-x-0" : "max-[760px]:-translate-x-full")}>
      <div className="flex flex-none flex-col gap-2.5 border-b border-dashed border-[color:var(--mwp-nline)] px-3.5 pb-[11px] pt-[13px]">
        <SearchInput value={q} onChange={setQ} placeholder={"Buscar en " + catDef.label.toLowerCase() + "…"} size="sm" />
        <div className="flex items-stretch gap-2">
          <div className="flex flex-none gap-[5px]">
            {(["grid", "list"] as const).map((vw) => (
              <button key={vw} type="button" aria-label={vw === "grid" ? "Rejilla" : "Lista"} onClick={() => setView(vw)} className={"grid h-[35px] w-[37px] place-items-center border-[1.5px] [border-radius:var(--wob-sm)] transition-colors " + (view === vw ? "border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [box-shadow:0_2px_0_rgba(0,0,0,0.3)]" : "border-dashed border-[color:var(--mwp-nline)] bg-transparent text-[color:var(--mwp-cream-dim)]")}>
                <Icon name={vw === "grid" ? "grid" : "list"} size={14} />
              </button>
            ))}
          </div>
          {CX_SORT[cat] && <Select value={sort} onChange={setSort} options={CX_SORT[cat].map((s) => ({ value: s.v, label: s.label }))} ariaLabel="Ordenar" className="min-w-0 flex-1" />}
        </div>
        {filterOpts.map((fo) => (
          <ChipGroup key={fo.key} label={fo.label} value={filters[fo.key] || ""} options={[{ value: "", label: "Todo" }, ...fo.options]} onChange={(v) => setFilters((f) => ({ ...f, [fo.key]: v as string }))} />
        ))}
        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]/[1.5] font-medium text-[color:var(--mwp-cream-dim)] opacity-85 max-[760px]:hidden">
          <Kbd>↑</Kbd><Kbd>↓</Kbd> entradas · <Kbd>←</Kbd><Kbd>→</Kbd> categoría · <Kbd>/</Kbd> buscar
        </div>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-11 pt-[13px] [scrollbar-width:thin]">
        <div className="mb-3 text-[11px]/[1.3] tracking-[0.06em] text-[color:var(--mwp-cream-dim)] [font-family:var(--mwf-disp)]">
          {filtered.length.toLocaleString("es")} {filtered.length === 1 ? catDef.singular : catDef.label.toLowerCase()}{filtered.length > CX_CAP ? " · mostrando " + CX_CAP : ""}
        </div>
        {filtered.length === 0 ? (
          catDef.remote && abilitiesLoading ? (
            <div className="flex items-center justify-center gap-3 py-[30px] text-[color:var(--mwp-cream-dim)]"><span className="h-[22px] w-[22px] animate-spin border-[3px] border-solid border-[color:var(--mwp-nline)] border-t-[color:var(--mwp-red)] [border-radius:50%] motion-reduce:animate-none" />Cargando habilidades…</div>
          ) : catDef.remote && MewData.remoteState.abilities === "error" ? (
            <Empty icon="alert" title="Habilidades no disponibles" lead="No se pudo cargar abilities.json." />
          ) : (
            <Empty icon="search" title="Sin resultados" lead="Ajusta la búsqueda o los filtros." />
          )
        ) : (
          <div className={view === "grid" ? "grid grid-cols-2 gap-x-2.5 gap-y-3 p-1" : "flex flex-col gap-2 p-0.5"}>
            {shown.map((r) => <CxCard key={r.id} cat={cat} rec={r} active={r.id === selId} onOpen={() => pick(r.id)} view={view} />)}
          </div>
        )}
        {filtered.length > CX_CAP && <div className="mt-4 text-center text-[12px]/[1.5] font-medium italic text-[color:var(--mwp-cream-dim)]">Refina la búsqueda para ver el resto.</div>}
      </div>
    </aside>
  )
}
