"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"
import { Chip } from "@/app/smartrotom/starbank/_components/ui"

const RAMP = [
  ["bg-sb-50", "sb-50"],
  ["bg-sb-100", "sb-100"],
  ["bg-sb-200", "sb-200"],
  ["bg-sb-300", "sb-300"],
  ["bg-sb-400", "sb-400"],
  ["bg-sb-500", "sb-500"],
  ["bg-sb-600", "sb-600"],
  ["bg-sb-700", "sb-700"],
  ["bg-sb-800", "sb-800"],
  ["bg-sb-900", "sb-900"],
  ["bg-sb-950", "sb-950"],
] as const

const SURFACES = [
  ["bg-sb-bg", "sb-bg"],
  ["bg-sb-surface", "sb-surface"],
  ["bg-sb-surface-2", "sb-surface-2"],
  ["bg-sb-surface-3", "sb-surface-3"],
  ["bg-sb-border", "sb-border"],
  ["bg-sb-border-strong", "sb-border-strong"],
] as const

const TEXT = [
  ["bg-sb-fg", "sb-fg"],
  ["bg-sb-fg-2", "sb-fg-2"],
  ["bg-sb-fg-muted", "sb-fg-muted"],
  ["bg-sb-fg-subtle", "sb-fg-subtle"],
] as const

const SEMANTIC = [
  ["bg-sb-pos", "sb-pos"],
  ["bg-sb-pos-soft", "sb-pos-soft"],
  ["bg-sb-neg", "sb-neg"],
  ["bg-sb-neg-soft", "sb-neg-soft"],
  ["bg-sb-warn", "sb-warn"],
  ["bg-sb-warn-soft", "sb-warn-soft"],
  ["bg-sb-info", "sb-info"],
  ["bg-sb-info-soft", "sb-info-soft"],
] as const

const CATEGORICAL = [
  ["bg-sb-league", "sb-league"],
  ["bg-sb-shop", "sb-shop"],
  ["bg-sb-heal", "sb-heal"],
  ["bg-sb-transfer", "sb-transfer"],
  ["bg-sb-reward", "sb-reward"],
  ["bg-sb-fee", "sb-fee"],
  ["bg-sb-subscription", "sb-subscription"],
  ["bg-sb-other", "sb-other"],
] as const

const SCALE: [string, React.ReactNode][] = [
  [
    "Display / Space Grotesk 600 / 26–28px",
    <span key="a" className="font-sb-display text-[28px] font-semibold tracking-[-0.02em] text-sb-fg">
      Cuenta principal
    </span>,
  ],
  [
    "Cifra / Space Grotesk 600 / 26px · tabular",
    <span key="b" className="font-sb-display text-[26px] font-semibold tabular-nums tracking-[-0.01em] text-sb-fg">
      128.400 ¥
    </span>,
  ],
  [
    "Cuerpo / Inter 400 / 13,5–15px",
    <span key="c" className="max-w-[52ch] text-[14px] text-sb-fg-2">
      Tu saldo se actualiza en cuanto la transferencia sale del banco de la Liga.
    </span>,
  ],
  [
    "Etiqueta / Inter 600 / 12px · versalitas",
    <span key="d" className="text-[12px] font-semibold uppercase tracking-[0.02em] text-sb-fg-muted">
      Concepto del envío
    </span>,
  ],
  [
    "Sobrelínea / Inter 400 / 11px · tracking",
    <span key="e" className="text-[11px] uppercase tracking-[0.1em] text-sb-fg-subtle">
      Últimos 30 días
    </span>,
  ],
]

const LEDGER = [
  ["Nómina de la Liga", "+ 12.500 ¥"],
  ["Ultra Balls ×10", "− 3.200 ¥"],
  ["Suscripción PC+", "− 990 ¥"],
  ["Cuota de gimnasio", "− 1.500 ¥"],
]

export function SbBasesChapter() {
  return (
    <>
      <Section
        id="sb-color"
        kicker="Starbank"
        title="Color"
        lead={
          <>
            Un banco es confianza, y la confianza aquí es azul. Rampa de once pasos anclada en{" "}
            <code>sb-600</code>, superficies casi blancas y un uso disciplinado del semántico: verde y rojo
            sólo cuantifican dinero, nunca decoran. Sistema claro únicamente — el oscuro está diferido.
          </>
        }
      >
        <Sample app="sb" title="Rampa de marca" code="sb-50 → sb-950" col canvas={false}>
          <Swatches tokens={RAMP} />
        </Sample>

        <Sample
          app="sb"
          title="Superficies"
          code="sb-bg · sb-surface · sb-border"
          col
          note={
            <>
              Tres superficies y dos líneas. La tarjeta (<code>sb-surface</code>) flota sobre el lienzo{" "}
              (<code>sb-bg</code>) con <code>shadow-sb-1</code>; <code>sb-surface-2</code> es el estado hover
              y <code>sb-surface-3</code> el relleno inerte (skeleton, chip neutro).
            </>
          }
          canvas={false}
        >
          <Swatches tokens={SURFACES} />
        </Sample>

        <Sample app="sb" title="Texto" code="sb-fg → sb-fg-subtle" col canvas={false}>
          <Swatches tokens={TEXT} />
        </Sample>

        <Sample
          app="sb"
          theme="dark"
          title="Tema oscuro"
          code='data-theme="dark"'
          col
          canvas={false}
          note={
            <>
              Las mismas clases, otras variables. Superficies y texto se intercambian bajo{" "}
              <code>.sb-app[data-theme=&quot;dark&quot;]</code>; la rampa de marca, los categóricos y el anillo de
              foco son constantes. El modo no lo elige Starbank: viene del selector de <em>Temas</em> de SmartRotom.
            </>
          }
        >
          <Swatches tokens={[...SURFACES, ...TEXT]} />
        </Sample>

        <Sample
          app="sb"
          title="Semánticos"
          code="pos · neg · warn · info"
          col
          note={
            <>
              Cada color fuerte trae su pareja <code>-soft</code>: el fuerte va al texto, el suave al fondo.
              Esa es toda la fórmula de los chips de estado.
            </>
          }
          canvas={false}
        >
          <Swatches tokens={SEMANTIC} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Chip tone="pos" dot>
              Ingreso
            </Chip>
            <Chip tone="neg" dot>
              Gasto
            </Chip>
            <Chip tone="warn" dot>
              Pendiente
            </Chip>
            <Chip tone="info" dot>
              Programado
            </Chip>
          </div>
        </Sample>

        <Sample
          app="sb"
          title="Categorías"
          code="_utils/categories.ts"
          col
          note={
            <>
              Ocho hues categóricos, uno por tipo de movimiento. El patrón es siempre el mismo tinte al 10%:{" "}
              <code>bg-sb-league/10 text-sb-league</code>. Las clases viven literales en{" "}
              <code>categories.ts</code> — construirlas al vuelo las haría invisibles para el JIT.
            </>
          }
          canvas={false}
        >
          <Swatches tokens={CATEGORICAL} />
        </Sample>
      </Section>

      <Section
        id="sb-tipografia"
        kicker="Starbank"
        title="Tipografía"
        lead={
          <>
            Dos voces: <strong className="text-sr-txt">Inter</strong> (<code>font-sb</code>) para toda la
            interfaz e <strong className="text-sr-txt">Space Grotesk</strong> (<code>font-sb-display</code>)
            para titulares y cifras. La raíz activa <code>cv11 · ss01 · ss03</code>, así que el 1 lleva
            remate y el 0 no se confunde con la O.
          </>
        }
      >
        <Sample app="sb" title="Escala" code="Inter · Space Grotesk" col>
          <div className="grid w-full gap-[18px]">
            {SCALE.map(([meta, node]) => (
              <div
                key={meta}
                className="grid grid-cols-1 items-baseline gap-2 border-b border-dashed border-sb-border pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[240px_1fr] sm:gap-[22px]"
              >
                <span className="font-mono text-[11px] font-medium leading-[1.6] text-sb-fg-subtle">{meta}</span>
                {node}
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          app="sb"
          title="Cifras tabulares"
          code="tabular-nums"
          col
          note={
            <>
              Innegociable: toda cifra monetaria lleva <code>tabular-nums</code>. Sin ella los dígitos tienen
              anchos distintos y la columna de importes deja de alinearse — un extracto bancario que baila.
            </>
          }
        >
          <div className="grid w-full gap-4 sm:grid-cols-2">
            {(
              [
                ["Proporcional — mal", "proportional-nums", "text-sb-neg"],
                ["Tabular — bien", "tabular-nums", "text-sb-pos"],
              ] as const
            ).map(([title, numeric, tone]) => (
              <div key={numeric} className="rounded-sb-lg border border-sb-border bg-sb-surface p-4 shadow-sb-1">
                <div className={cn("mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]", tone)}>
                  {title}
                </div>
                <div className="grid gap-2">
                  {LEDGER.map(([label, amount]) => (
                    <div key={label} className="flex items-center justify-between gap-6 text-[13.5px]">
                      <span className="truncate text-sb-fg-2">{label}</span>
                      <span className={cn("font-sb-display font-semibold text-sb-fg", numeric)}>{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Sample>

        <Sample app="sb" title="Rasgos" code="font-feature-settings" col>
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {(
              [
                ["cv11", "1 con remate", "1.111,10 ¥"],
                ["ss01", "0 sin ambigüedad", "0,00 ¥"],
                ["ss03", "Símbolos limpios", "@ Rotom_Dex"],
              ] as const
            ).map(([feat, desc, sample]) => (
              <div key={feat} className="rounded-sb-lg border border-sb-border bg-sb-surface p-4 shadow-sb-1">
                <div className={cn(MONO_LABEL, "mb-2 text-sb-fg-subtle")}>{feat}</div>
                <div className="font-sb-display text-[20px] font-semibold tabular-nums text-sb-fg">{sample}</div>
                <div className="mt-1 text-[12px] text-sb-fg-muted">{desc}</div>
              </div>
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
