"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"
import { ACCENT_OPTIONS } from "../../../notas/_hooks/useNotesTheme"

// Constant across themes: the orange ramp + the seven category hues.
const RAMP = [
  ["bg-nt-50", "50"],
  ["bg-nt-100", "100"],
  ["bg-nt-200", "200"],
  ["bg-nt-300", "300"],
  ["bg-nt-400", "400"],
  ["bg-nt-500", "500"],
  ["bg-nt-600", "600"],
  ["bg-nt-700", "700"],
  ["bg-nt-800", "800"],
  ["bg-nt-900", "900"],
  ["bg-nt-950", "950"],
] as const

const CATEGORY = [
  ["bg-nt-c-primary", "Primary"],
  ["bg-nt-c-secondary", "Secondary"],
  ["bg-nt-c-accent", "Accent"],
  ["bg-nt-c-success", "Success"],
  ["bg-nt-c-warning", "Warning"],
  ["bg-nt-c-error", "Error"],
  ["bg-nt-c-info", "Info"],
] as const

// Theme-dependent: every one of these swaps value between dark and light.
const SURFACES = [
  ["bg-nt-bg", "Fondo"],
  ["bg-nt-bg-1", "Fondo 1"],
  ["bg-nt-bg-2", "Fondo 2"],
  ["bg-nt-panel", "Panel"],
  ["bg-nt-panel-2", "Panel 2"],
  ["bg-nt-elevated", "Elevado"],
  ["bg-nt-doc", "Documento"],
  ["bg-nt-hover", "Hover"],
  ["bg-nt-hover-strong", "Hover fuerte"],
  ["bg-nt-border", "Borde"],
  ["bg-nt-border-2", "Borde 2"],
] as const

const TEXT = [
  ["bg-nt-fg", "Texto"],
  ["bg-nt-fg-muted", "Atenuado"],
  ["bg-nt-fg-subtle", "Sutil"],
  ["bg-nt-accent", "Acento"],
  ["bg-nt-accent-fg", "Acento (tinta)"],
  ["bg-nt-on-accent", "Sobre acento"],
] as const

// The provider keeps its hex→triplet converter private, so the showcase carries its
// own: `--nt-accent` is an RGB *triplet*, never a hex (Tailwind alpha needs it).
function triplet(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const ACCENT_NAMES: Record<string, string> = {
  "#f97316": "Naranja (por defecto)",
  "#3b82f6": "Azul",
  "#d946ef": "Fucsia",
  "#10b981": "Esmeralda",
}

function DocDemo({ serif }: { serif?: boolean }) {
  return (
    <div className={cn("nt-doc nt-scroll max-h-[440px] min-h-0 overflow-auto p-7", serif && "serif")}>
      <h1>Arquitectura de Notas</h1>
      <p className="lead">
        Un documento es sólo HTML: el editor escribe sobre <code>.nt-doc</code> y la prosa se resuelve
        por descendencia.
      </p>
      <p>
        Las notas se enlazan entre sí con <a className="wikilink">enlaces wiki</a>, que el editor
        resuelve contra el grafo. El resto —listas, tablas, citas— hereda el ritmo del documento.
      </p>
      <ul className="todo">
        <li data-done="true">Migrar el editor a wikilinks nativos</li>
        <li>Indexar el grafo de retroenlaces</li>
      </ul>
      <blockquote>El documento manda: la interfaz se aparta.</blockquote>
      <table>
        <thead>
          <tr>
            <th>Bloque</th>
            <th>Atajo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Título</td>
            <td>
              <code>##</code>
            </td>
          </tr>
          <tr>
            <td>Tarea</td>
            <td>
              <code>[]</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function NtBasesChapter() {
  return (
    <>
      <Section
        id="nt-color"
        kicker="Notas"
        title="Color y temas"
        lead="Notas es el único sistema de SmartRotom con tema doble real: oscuro por defecto, claro completo, y un acento que el usuario cambia en caliente. Las superficies y el texto viven en variables CSS que se intercambian bajo `.nt-app[data-theme]`; la rampa naranja y las siete tintas de categoría son constantes."
      >
        <Sample
          title="Superficies y texto · oscuro"
          code='.nt-app'
          app="nt"
          note="El tema por defecto. Los tokens `nt-hover*` y `nt-border*` son colores con alfa (no tripletes), por eso apenas se ven sobre el fondo: existen para teñir, no para rellenar." canvas={false}>
          <Swatches tokens={[...SURFACES, ...TEXT]} />
        </Sample>

        <Sample
          title="Superficies y texto · claro"
          code='.nt-app[data-theme="light"]'
          app="nt"
          theme="light"
          note="Mismos nombres de token, valores intercambiados. Ningún componente conoce el tema: pide `bg-nt-panel` y recibe lo que toque." canvas={false}>
          <Swatches tokens={[...SURFACES, ...TEXT]} />
        </Sample>

        <Sample
          title="Rampa naranja"
          code="nt-50 … nt-950"
          app="nt"
          note="Constante en ambos temas. La usan los degradados de marca (el botón primario baja de `nt-500` a `nt-600`), no el chrome." canvas={false}>
          <Swatches tokens={RAMP} />
        </Sample>

        <Sample
          title="Tintas de categoría"
          code="nt-c-*"
          app="nt"
          note="Siete tintas independientes del tema: dan color a carpetas y etiquetas. Se consumen por clave (`_utils/colors.ts` mapea a clases literales y a tripletes RGB para estilos en línea) — nunca concatenando el nombre de la clase con la clave, porque el JIT de Tailwind no puede ver una clase que se construye en tiempo de ejecución." canvas={false}>
          <Swatches tokens={CATEGORY} />
        </Sample>

        <Sample
          title="Acento en tiempo de ejecución"
          code="--nt-accent"
          app="nt"
          note="El selector de ajustes escribe `--nt-accent` / `--nt-accent-fg` en línea sobre la raíz `.nt-app`, así que todo lo que pide `nt-accent` se recolorea sin recompilar. Aquí cada bloque simula ese override con su propio triplete."
        >
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            {ACCENT_OPTIONS.map((hex) => (
              <div
                key={hex}
                className="rounded-nt-md border border-nt-border bg-nt-panel p-3"
                style={{ ["--nt-accent" as string]: triplet(hex), ["--nt-accent-fg" as string]: triplet(hex) }}
              >
                <div className="h-9 rounded-nt-sm bg-nt-accent" />
                <div className="mt-2.5 text-[12px] font-[550] text-nt-accent-fg">Enlace wiki</div>
                <div className="mt-1 font-nt-mono text-[10px] text-nt-fg-subtle">{hex}</div>
                <div className="mt-0.5 text-[11px] text-nt-fg-muted">{ACCENT_NAMES[hex] ?? "Personalizado"}</div>
              </div>
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="nt-tipografia"
        kicker="Notas"
        title="Tipografía y prosa"
        lead="Cuatro voces: Inter para la interfaz, Orbitron para las marcas de la app, IBM Plex Mono para código y atajos, y un serif del sistema para el modo lectura. La prosa del editor no se compone con utilidades: es la clase de componente `.nt-doc`, porque el HTML editable se estiliza por descendencia."
      >
        <Sample title="Escala" code="font-nt · font-nt-display · font-nt-mono · font-nt-read" app="nt" col>
          <div className="grid w-full gap-[18px]">
            {[
              ["Marca / Orbitron 700 / 20–28px", <span key="a" className="font-nt-display text-[26px] font-bold tracking-tight text-nt-fg">Notas</span>],
              ["Título / Inter 650 / 21–32px", <span key="b" className="text-[28px] font-[650] leading-tight tracking-[-.02em] text-nt-fg">Arquitectura de Notas</span>],
              ["Interfaz / Inter 400–550 / 13–16px", <span key="c" className="max-w-[52ch] text-[14px] text-nt-fg-muted">Las notas se enlazan entre sí; el grafo se reconstruye al guardar.</span>],
              ["Dato / Plex Mono 400–500 / 10–13px", <span key="d" className="font-nt-mono text-[12px] text-nt-fg-subtle">actualizado hace 4 min · 3 retroenlaces</span>],
              ["Lectura / serif 400 / 18px", <span key="e" className="max-w-[46ch] font-nt-read text-[18px] leading-[1.65] text-nt-fg">El modo serif cambia sólo la prosa, nunca el chrome.</span>],
            ].map(([meta, node], i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-baseline gap-2 border-b border-dashed border-nt-border pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[230px_1fr] sm:gap-[22px]"
              >
                <span className={cn(MONO_LABEL, "text-nt-fg-subtle")}>{meta as React.ReactNode}</span>
                {node as React.ReactNode}
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="Prosa del editor · oscuro"
          code=".nt-doc"
          app="nt"
          padded={false}
          note="La única clase de componente del sistema: títulos, listas de tareas (`ul.todo` + `data-done`), citas, código, tablas y enlaces wiki. Aquí se le sobrescribe el `padding` con utilidades para que quepa en la ficha; en la app conserva su respiración de 52px."
        >
          <div className="w-full bg-nt-bg-1 p-5">
            <DocDemo />
          </div>
        </Sample>

        <Sample
          title="Prosa · claro y modo serif"
          code=".nt-doc.serif"
          app="nt"
          theme="light"
          padded={false}
          note="`.nt-doc.serif` sube el cuerpo a 18px y cambia la familia a la pila serif (`font-nt-read`). Es un ajuste del usuario, no un tema aparte: convive con claro y con oscuro."
        >
          <div className="w-full bg-nt-bg-1 p-5">
            <DocDemo serif />
          </div>
        </Sample>
      </Section>
    </>
  )
}
