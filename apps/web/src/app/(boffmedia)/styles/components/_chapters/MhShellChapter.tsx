"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sample, Section } from "../showcase-shared"
import { Icon } from "@boffmedia/ui"
import { MhFavStar, MhToolTabs } from "@/components/boffmedia/ui/mh-shell"
import { MHDB } from "./mh-db-demo"

const MH_VARS = {
  ["--mh" as string]: "hsl(152 52% 46%)",
  ["--mh-bright" as string]: "hsl(152 58% 56%)",
  ["--mh-soft" as string]: "hsl(152 52% 46% / 0.13)",
  ["--mh-line" as string]: "hsl(152 52% 46% / 0.4)",
} as React.CSSProperties

const MONSTER = { name: "Rathalos", title: "Rey de los cielos" }

export function MhShellChapter() {
  const weapon = MHDB.weapon(1006)
  return (
    <div style={MH_VARS}>
      <Section
        id="mhshellnav"
        kicker="Monster Hunter"
        title="Chasis unificado"
        lead={
          <>
            Todas las herramientas de MH Wilds comparten un mismo chasis: una barra de <strong>tabs persistente</strong> (<code>&lt;MhToolTabs&gt;</code>) para saltar entre Bestiario, Armas, Armadura, Planner, Caza y Daño sin volver al hub, más un cajón de <strong>favoritos globales</strong> siempre accesible.
          </>
        }
      >
        <Sample title="Barra de tabs" code="<MhToolTabs active onOpenFavs>" col note="La herramienta activa se marca con el acento esmeralda del juego; el contador de favoritos aparece cuando hay elementos guardados.">
          <div className="w-full overflow-hidden border border-solid border-line">
            <MhToolTabs go={() => {}} active="armas" onOpenFavs={() => {}} />
          </div>
        </Sample>
        <Sample title="Estrella de favorito" code="<MhFavStar type id label>" note="Un único almacén reúne armas, conjuntos, monstruos y builds; la Lista de caza y el cajón de favoritos leen de él.">
          <MhFavStar type="weapon" id="demo-w" label="Demo" meta="R7" defaultOn />
          <MhFavStar type="monster" id="demo-m" label="Demo" />
          <MhFavStar type="armorSet" id="demo-s" label="Demo" />
        </Sample>
      </Section>

      <Section id="mhshelldmg" kicker="Monster Hunter" title="Laboratorio de daño" lead={<>El Laboratorio cruza un arma con la tabla de hitzones de un monstruo. Cada parte muestra el índice de daño físico + elemental con la mejor resaltada.</>}>
        <Sample title="Selector arma × monstruo" code=".mh-dmgsel" col>
          <div className="flex w-full flex-wrap items-stretch gap-3">
            <div style={{ "--sh": 15 } as React.CSSProperties} className="flex flex-1 basis-[300px] cursor-pointer items-center gap-3 border border-solid border-line bg-panel px-[14px] py-3 text-left transition-[border-color,background] duration-[140ms] cut-corner cut-corner-edge hover:[--cut-line:var(--line-2)] [--cut-line:var(--line)] [--cut-lg:10px] hover:border-line-2 hover:bg-panel-2">
              <span className="grid h-11 w-11 flex-none place-items-center border border-solid border-[hsl(var(--sh)_52%_46%/0.4)] bg-[hsl(var(--sh)_52%_46%/0.13)] text-[hsl(var(--sh)_58%_60%)]">
                <Icon name="sword" size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-mono text-[9px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim">Arma</span>
                <span className="truncate font-display text-[17px]/[1.1] font-extrabold italic uppercase">{weapon.name}</span>
                <span className="truncate font-mono text-[10px]/[1.3] font-medium text-txt-muted">
                  {weapon.typeLabel} · Atk {weapon.attack}
                </span>
              </span>
              <Icon name="edit" size={16} className="flex-none text-txt-dim" />
            </div>
            <span className="flex-none self-center font-mono text-[11px]/none font-bold uppercase tracking-[0.1em] text-txt-dim">contra</span>
            <div className="flex flex-1 basis-[300px] cursor-pointer items-center gap-3 border border-solid border-line bg-panel px-[14px] py-3 text-left transition-[border-color,background] duration-[140ms] cut-corner cut-corner-edge hover:[--cut-line:var(--line-2)] [--cut-line:var(--line)] [--cut-lg:10px] hover:border-line-2 hover:bg-panel-2">
              <span className="grid h-11 w-11 flex-none place-items-center border border-solid border-[hsl(8_52%_46%/0.4)] bg-[hsl(8_52%_46%/0.13)] text-[hsl(8_58%_60%)]">
                <Icon name="skull" size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-mono text-[9px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim">Monstruo</span>
                <span className="truncate font-display text-[17px]/[1.1] font-extrabold italic uppercase">{MONSTER.name}</span>
                <span className="truncate font-mono text-[10px]/[1.3] font-medium text-txt-muted">{MONSTER.title}</span>
              </span>
              <Icon name="edit" size={16} className="flex-none text-txt-dim" />
            </div>
          </div>
        </Sample>
        <Sample title="Fila de daño por parte" code=".mh-dmg__row" col>
          <div className="flex w-full max-w-[460px] flex-col gap-[7px]">
            <div className="border border-solid border-line border-l-2 border-l-[color:var(--mh)] bg-[var(--mh-soft)] px-3 py-2.5">
              <div className="mb-[7px] flex items-center justify-between gap-2.5">
                <span className="inline-flex items-center gap-1.5 font-body text-[13px]/[1.2] font-semibold">
                  <Icon name="star" size={12} className="text-[color:var(--mh-bright)]" />
                  Cabeza
                </span>
                <span className="font-display text-[17px]/none font-extrabold italic">20.7</span>
              </div>
              <div className="flex h-[9px] overflow-hidden border border-solid border-line bg-base-deep">
                <span className="h-full bg-[#ff7a5c]" style={{ width: "72%" }} />
                <span className="h-full bg-[color:var(--info)]" style={{ width: "18%" }} />
              </div>
              <div className="mt-[7px] flex flex-wrap gap-[14px] font-mono text-[11px]/none font-semibold text-txt-muted [&_i]:not-italic [&_i]:text-txt-dim">
                <span>
                  Fís 16.2 <i>(65%)</i>
                </span>
                <span className="text-[color:var(--info)]">Elem 4.5</span>
              </div>
            </div>
            <div className="border border-solid border-line border-l-2 border-l-line-2 bg-base-2 px-3 py-2.5">
              <div className="mb-[7px] flex items-center justify-between gap-2.5">
                <span className="inline-flex items-center gap-1.5 font-body text-[13px]/[1.2] font-semibold">Cuello</span>
                <span className="font-display text-[17px]/none font-extrabold italic">13.1</span>
              </div>
              <div className="flex h-[9px] overflow-hidden border border-solid border-line bg-base-deep">
                <span className="h-full bg-[#ff7a5c]" style={{ width: "48%" }} />
                <span className="h-full bg-[color:var(--info)]" style={{ width: "12%" }} />
              </div>
              <div className="mt-[7px] flex flex-wrap gap-[14px] font-mono text-[11px]/none font-semibold text-txt-muted [&_i]:not-italic [&_i]:text-txt-dim">
                <span>
                  Fís 10.8 <i>(50%)</i>
                </span>
                <span className="text-[color:var(--info)]">Elem 2.3</span>
              </div>
            </div>
          </div>
        </Sample>
      </Section>

      <Section id="mhshellhunt" kicker="Monster Hunter" title="Lista de caza" lead={<>La Caza agrupa por monstruo los materiales que faltan para tus objetivos (builds guardadas + favoritos), con casillas de progreso sincronizadas con el Planner.</>}>
        <Sample title="Tarjeta de caza" code=".mh-huntcard" col>
          <div className="w-full max-w-[460px] border border-solid border-line bg-panel cut-corner cut-corner-edge">
            <div className="flex items-center gap-[11px] border-b border-solid border-line px-[14px] py-3">
              <span className="grid h-[34px] w-[34px] flex-none place-items-center border border-solid border-[hsl(8_60%_55%/0.4)] bg-[hsl(8_60%_55%/0.13)] text-[hsl(8_70%_62%)]">
                <Icon name="skull" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[16px]/none font-extrabold italic uppercase text-txt">Rathalos</div>
                <div className="mt-[3px] flex items-center gap-1.5 font-mono text-[11px]/[1.2] font-medium text-txt-muted">3 pendientes de 4</div>
              </div>
              <span className="inline-flex items-center gap-1.5 border border-solid border-line bg-panel-2 px-2 py-1 font-mono text-[10px]/none font-semibold uppercase text-txt-dim">
                <Icon name="crosshair" size={11} />
                Daño
              </span>
            </div>
            <div className="flex flex-col gap-1 px-[14px] py-3">
              {[
                ["Escama de Rathalos", "R5", "var(--rar5)", "×4"],
                ["Rubí de fuego", "R7", "var(--rar7)", "×1"],
              ].map(([name, rar, col, qty]) => (
                <div key={name} className="flex items-center gap-2.5 py-1">
                  <span className="h-3 w-3 flex-none rotate-45 border-2 border-solid" style={{ borderColor: col }} />
                  <span className="flex-1 font-body text-[13px] text-txt">
                    {name} <span className="ml-1 font-mono text-[10px] text-txt-dim">{rar}</span>
                  </span>
                  <span className="font-mono text-[12px] font-bold text-txt-muted">{qty}</span>
                </div>
              ))}
            </div>
          </div>
        </Sample>
      </Section>
    </div>
  )
}
