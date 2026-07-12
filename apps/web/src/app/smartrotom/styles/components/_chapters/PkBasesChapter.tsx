"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"

const PRIMARY = [
  ["bg-pk-primary-50", "50"],
  ["bg-pk-primary-100", "100"],
  ["bg-pk-primary-200", "200"],
  ["bg-pk-primary-300", "300"],
  ["bg-pk-primary-400", "400"],
  ["bg-pk-primary-500", "500"],
  ["bg-pk-primary-600", "600"],
  ["bg-pk-primary-700", "700"],
  ["bg-pk-primary-800", "800"],
  ["bg-pk-primary-900", "900"],
] as const

const SECONDARY = [
  ["bg-pk-secondary-300", "Cian 300"],
  ["bg-pk-secondary-400", "Cian 400"],
  ["bg-pk-secondary-500", "Cian 500"],
  ["bg-pk-secondary-600", "Cian 600"],
  ["bg-pk-secondary-700", "Cian 700"],
  ["bg-pk-secondary-900", "Cian 900"],
  ["bg-pk-accent-300", "Púrpura 300"],
  ["bg-pk-accent-400", "Púrpura 400"],
  ["bg-pk-accent-500", "Púrpura 500"],
  ["bg-pk-accent-600", "Púrpura 600"],
  ["bg-pk-accent-900", "Púrpura 900"],
  ["bg-pk-highlight-400", "Lima 400"],
  ["bg-pk-highlight-500", "Lima 500"],
] as const

const SURFACE = [
  ["bg-pk-surface-950", "950 · lienzo"],
  ["bg-pk-surface-900", "900 · fondo"],
  ["bg-pk-surface-800", "800 · panel"],
  ["bg-pk-surface-700", "700 · borde"],
  ["bg-pk-surface-600", "600"],
  ["bg-pk-surface-500", "500 · sutil"],
  ["bg-pk-surface-400", "400 · atenuado"],
  ["bg-pk-surface-300", "300"],
  ["bg-pk-surface-200", "200"],
  ["bg-pk-surface-100", "100 · texto"],
  ["bg-pk-surface-50", "50 · titular"],
] as const

const STATE = [
  ["bg-pk-success", "Éxito"],
  ["bg-pk-warning", "Aviso"],
  ["bg-pk-error", "Error"],
] as const

export function PkBasesChapter() {
  return (
    <>
      <Section
        id="pk-color"
        kicker="Pokédex"
        title="Color"
        lead="Sistema oscuro y sólo oscuro: no hay tema claro. Una rampa de superficie fría de 950 a 50 que hace de lienzo, panel y texto a la vez, y tres tonos de señal —naranja primario, cian secundario y púrpura de acento— que se reservan para lo que hay que mirar. Los colores de tipo de Pokémon no viven aquí: son datos."
      >
        <Sample
          title="Superficie"
          code="pk-surface-950 … 50"
          app="pk"
          note="La misma rampa hace de fondo (950–800) y de tinta (500–50). El chrome de la Pokédex no tiene tokens de borde propios: usa `border-white/[0.05]` sobre la superficie." canvas={false}>
          <Swatches tokens={SURFACE} />
        </Sample>

        <Sample
          title="Primario · naranja"
          code="pk-primary-50 … 900"
          app="pk"
          note="El naranja de marca (`pk-primary-500` es el del logo). Los degradados de la Pokédex bajan de `400` a `700`." canvas={false}>
          <Swatches tokens={PRIMARY} />
        </Sample>

        <Sample
          title="Secundario, acento y realce"
          code="pk-secondary · pk-accent · pk-highlight"
          app="pk"
          note="Cian para lo informativo, púrpura para lo raro o legendario, lima para el realce numérico. Son las mismas tintas que usan las rampas de estadísticas (`_utils/dexMeta.ts`)." canvas={false}>
          <Swatches tokens={SECONDARY} />
        </Sample>

        <Sample title="Estado" code="pk-success · pk-warning · pk-error" app="pk" canvas={false}>
          <Swatches tokens={STATE} />
        </Sample>
      </Section>

      <Section
        id="pk-tipografia"
        kicker="Pokédex"
        title="Tipografía"
        lead="Tres voces: Orbitron para todo lo que grita (titulares, chips de tipo, cifras), Inter para leer, IBM Plex Mono para lo operativo —números de dex, etiquetas de sección, datos—."
      >
        <Sample title="Escala" code="font-pk-display · font-pk · font-pk-mono" app="pk" col>
          <div className="grid w-full gap-[18px]">
            {[
              ["Display / Orbitron 700 / 28–40px", <span key="a" className="font-pk-display text-[32px] font-bold tracking-tight text-pk-surface-50">Pokédex Nacional</span>],
              ["Titular / Orbitron 700 / 20–28px", <span key="b" className="font-pk-display text-[22px] font-bold tracking-tight text-pk-surface-50">Charizard</span>],
              ["Cuerpo / Inter 400 / 13–15px", <span key="c" className="max-w-[52ch] text-[13.5px] leading-[1.55] text-pk-surface-400">Escupe un fuego tan caliente que funde las rocas. Puede causar incendios forestales sin querer.</span>],
              ["Dato / Plex Mono 400–500 / 10–13px", <span key="d" className="font-pk-mono text-[12px] uppercase tracking-[0.12em] text-pk-surface-500">Nº 006 · Región Kanto</span>],
              ["Cifra / Orbitron 700 tabular", <span key="e" className="font-pk-display text-2xl font-bold tabular-nums text-pk-surface-50">534</span>],
            ].map(([meta, node], i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-baseline gap-2 border-b border-dashed border-white/[0.06] pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[240px_1fr] sm:gap-[22px]"
              >
                <span className={cn(MONO_LABEL, "font-pk-mono text-pk-surface-500")}>{meta as React.ReactNode}</span>
                {node as React.ReactNode}
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="Etiqueta de sección"
          code="font-pk-mono · uppercase · tracking-[0.12em]"
          app="pk"
          note="El «eyebrow» de la Pokédex: mono, versalita, muy espaciado y en `pk-surface-500`. Aparece en `PageHead`, en las cabeceras de sección y en las fichas."
        >
          <span className="font-pk-mono text-[10.5px] uppercase tracking-[0.12em] text-pk-surface-500">Base de datos</span>
          <span className="font-pk-mono text-[10.5px] uppercase tracking-[0.12em] text-pk-surface-500">Movimiento</span>
          <span className="font-pk-mono text-[10.5px] uppercase tracking-[0.12em] text-pk-primary-300">Apariciones</span>
        </Sample>
      </Section>
    </>
  )
}
