"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"

// Los mismos tokens, renderizados dos veces: la rampa de superficie se templa para
// Mewtube (para que el rosa case) y se mantiene fría para Mewtwitch.
const MW_TOKENS = [
  ["bg-mw-bg", "Fondo"],
  ["bg-mw-900", "900"],
  ["bg-mw-800", "800"],
  ["bg-mw-700", "700"],
  ["bg-mw-panel", "Panel"],
  ["bg-mw-panel-2", "Panel 2"],
  ["bg-mw-line", "Línea"],
  ["bg-mw-line-strong", "Línea fuerte"],
  ["bg-mw-fg", "Texto"],
  ["bg-mw-fg-mute", "Atenuado"],
  ["bg-mw-fg-subtle", "Sutil"],
  ["bg-mw-fg-faint", "Tenue"],
  ["bg-mw-accent", "Acento"],
  ["bg-mw-accent-dark", "Acento oscuro"],
  ["bg-mw-accent-on", "Sobre acento"],
  ["bg-mw-highlight", "Destacado"],
  ["bg-mw-secondary", "Secundario"],
  ["bg-mw-success", "Éxito"],
  ["bg-mw-warning", "Aviso"],
  ["bg-mw-error", "Error"],
] as const

const TINTS = [
  ["bg-mw-accent/[.14]", "14 %"],
  ["bg-mw-accent/25", "25 %"],
  ["bg-mw-accent/50", "50 %"],
  ["bg-mw-accent", "100 %"],
] as const

function TintRamp() {
  return (
    <div className="grid w-full grid-cols-4 gap-2">
      {TINTS.map(([cls, label]) => (
        <div key={cls} className="rounded-mw-lg border border-mw-line bg-mw-900 p-2">
          <i className={cn("block h-12 rounded-mw-md", cls)} />
          <span className="mt-2 block font-mono text-[0.625rem] font-medium text-mw-fg-subtle">{label}</span>
        </div>
      ))}
    </div>
  )
}

const TYPE_ROWS: readonly (readonly [string, React.ReactNode])[] = [
  [
    "Display / Orbitron 800 / 26–34px",
    <span key="a" className="font-mw-display text-[1.875rem] font-extrabold leading-[1.15] tracking-[-0.01em] text-mw-fg">
      Directos en curso
    </span>,
  ],
  [
    "Título / Orbitron 700 / 18–22px",
    <span key="b" className="font-mw-display text-[1.25rem] font-bold leading-[1.2] text-mw-fg">
      Seguir viendo
    </span>,
  ],
  [
    "UI / Inter 600 / 13–14px",
    <span key="c" className="text-sm font-semibold text-mw-fg">
      Suscribirse · Seguir · Compartir
    </span>,
  ],
  [
    "Cuerpo / Inter 400 / 14–15px",
    <span key="d" className="max-w-[52ch] text-sm text-mw-fg-mute">
      Un solo sistema de medios con dos acentos: vídeo bajo demanda y retransmisión en directo comparten
      primitivas, rejilla y tipografía.
    </span>,
  ],
  [
    "Contador / mono 700 / 11px",
    <span key="e" className="font-mono text-[0.6875rem] font-bold text-mw-fg">
      12 480 espectadores · 27:39
    </span>,
  ],
  [
    "Wordmark / Lexend Mega 800",
    <span key="f" className="font-mw-wide text-[1.125rem] font-extrabold tracking-[-0.02em] text-mw-accent">
      Mewtube
    </span>,
  ],
]

export function MwBasesChapter() {
  return (
    <>
      <Section
        id="mw-color"
        kicker="Media"
        title="Color y doble acento"
        lead={
          <>
            Un sistema, dos acentos. Todo lo que separa a Mewtube de Mewtwitch vive en variables CSS que cuelgan de{" "}
            <code>data-app</code> en la raíz <code>.mw-app</code>: el acento (rosa Mew / morado directo) y la rampa de
            superficie, que se templa para que el rosa case y se queda fría para el morado. Ningún componente conoce la
            app en la que se monta — nunca hay una clase dinámica.
          </>
        }
      >
        <Sample
          app="mw"
          media="mewtube"
          title="Paleta · Mewtube"
          code='data-app="mewtube"'
          note={
            <>
              Rampa cálida: <code>--mw-bg</code> tira a berenjena y las líneas llevan un tinte rosa, así el acento{" "}
              <code>#ec4899</code> no flota sobre un gris frío.
            </>
          }
          canvas={false}
        >
          <Swatches tokens={MW_TOKENS} />
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="Paleta · Mewtwitch"
          code='data-app="mewtwitch"'
          note={
            <>
              Misma lista de tokens, misma clase (<code>bg-mw-800</code>, <code>text-mw-accent</code>…): solo cambia el
              atributo de la raíz. Rampa fría de pizarra + morado <code>#a855f7</code>.
            </>
          }
          canvas={false}
        >
          <Swatches tokens={MW_TOKENS} />
        </Sample>

        <Sample
          app="mw"
          media="mewtube"
          title="Tintes del acento · Mewtube"
          code="bg-mw-accent/14 · /25 · /50"
        >
          <TintRamp />
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="Tintes del acento · Mewtwitch"
          code="bg-mw-accent/14 · /25 · /50"
          note={
            <>
              Los rellenos suaves, los bordes y las sombras se derivan del acento con alfa de Tailwind (
              <code>bg-mw-accent/[.14]</code>) o con <code>color-mix</code>, no con un token por app. Añadir una tercera
              superficie es añadir una entrada en el plugin, no una rama en el componente.
            </>
          }
        >
          <TintRamp />
        </Sample>
      </Section>

      <Section
        id="mw-tipografia"
        kicker="Media"
        title="Tipografía"
        lead={
          <>
            Tres voces autoalojadas: <code>font-mw</code> (Inter) para toda la interfaz y el cuerpo,{" "}
            <code>font-mw-display</code> (Orbitron) para títulos de sección y señales de directo, y{" "}
            <code>font-mw-wide</code> (Lexend Mega) reservada al wordmark. Los contadores van en mono tabular.
          </>
        }
      >
        <Sample app="mw" media="mewtube" title="Escala" code="Inter · Orbitron · Lexend Mega" col>
          <div className="grid w-full gap-[1.125rem]">
            {TYPE_ROWS.map(([meta, node]) => (
              <div
                key={meta}
                className="grid grid-cols-1 items-baseline gap-2 border-b border-dashed border-mw-line pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[13.125rem_1fr] sm:gap-[1.375rem]"
              >
                <span className={cn(MONO_LABEL, "normal-case tracking-[0.06em] text-mw-fg-faint")}>{meta}</span>
                {node}
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          app="mw"
          media="mewtube"
          title="Wordmark · Mewtube"
          code="font-mw-wide"
        >
          <span className="font-mw-wide text-[1.625rem] font-extrabold tracking-[-0.03em] text-mw-accent">Mewtube</span>
        </Sample>

        <Sample
          app="mw"
          media="mewtwitch"
          title="Wordmark · Mewtwitch"
          code="font-mw-wide"
          note={
            <>
              Lexend Mega solo aparece aquí: es la firma de la marca, no una fuente de interfaz. El color sale de{" "}
              <code>text-mw-accent</code>, así que el wordmark cambia de acento con la app sin tocar el marcado.
            </>
          }
        >
          <span className="font-mw-wide text-[1.625rem] font-extrabold tracking-[-0.03em] text-mw-accent">Mewtwitch</span>
        </Sample>
      </Section>
    </>
  )
}
