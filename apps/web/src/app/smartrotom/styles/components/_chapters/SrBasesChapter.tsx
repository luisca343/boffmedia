"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DISPLAY, DISPLAY_EM, HEAD4, MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"

const SYSTEMS = [
  {
    name: "Chrome",
    what: "nav, ajustes, errores, carga",
    ns: "sr-*",
    scope: "—  (global)",
    backing: "Alias de variables CSS en globals.css — el selector de tema los recolorea",
  },
  {
    name: "Starbank",
    what: "fintech",
    ns: "sb-*",
    scope: ".sb-app",
    backing: "Hex fijo · solo claro",
  },
  {
    name: "ChatApp",
    what: "mensajería",
    ns: "ca-*",
    scope: ".ca-app[data-theme]",
    backing: "Variables CSS · claro/oscuro real + acento en runtime",
  },
  {
    name: "Notas",
    what: "notas enlazadas",
    ns: "nt-*",
    scope: ".nt-app[data-theme]",
    backing: "Variables CSS · oscuro por defecto + claro + acento",
  },
  {
    name: "Pokédex",
    what: "gaming",
    ns: "pk-*",
    scope: ".pk-app",
    backing: "Hex fijo · solo oscuro",
  },
  {
    name: "Mewtube + Mewtwitch",
    what: "media",
    ns: "mw-*",
    scope: ".mw-app[data-app]",
    backing: "Variables CSS · oscuro · dos acentos, un sistema",
  },
] as const

// The palette is var-backed (globals.css maps every --sr-* onto a themeable var), so the
// five-theme picker recolours these swatches for free — no per-theme swatch list.
const SR_TOKENS = [
  ["bg-sr-bg", "Fondo"],
  ["bg-sr-panel", "Panel"],
  ["bg-sr-panel-2", "Panel 2"],
  ["bg-sr-line", "Línea"],
  ["bg-sr-line-2", "Línea 2"],
  ["bg-sr-txt", "Texto"],
  ["bg-sr-txt-muted", "Atenuado"],
  ["bg-sr-txt-dim", "Tenue"],
  ["bg-sr-accent", "Acento"],
  ["bg-sr-accent-bright", "Acento vivo"],
  ["bg-sr-accent-soft", "Acento suave"],
  ["bg-sr-ok", "OK"],
  ["bg-sr-warn", "Aviso"],
  ["bg-sr-bad", "Error"],
] as const

const CUTS = [
  ["CUT 10px", "cut", "--cut"],
  ["SEAL 10px", "cut-seal", "--cut"],
  ["CORNER 16px", "cut-corner", "--cut-lg"],
  ["TAG 8px", "cut-tag", "--cut-tag"],
] as const

export function SrBasesChapter() {
  return (
    <>
      <Section
        id="sr-arquitectura"
        kicker="Bases"
        title="Seis sistemas"
        lead={
          <>
            SmartRotom no es un sistema de diseño, son seis. El chrome <code>sr-*</code> es el marco —
            nav, migas, ajustes, carga— y ninguna de las seis apps lo usa: cada una tiene su propio
            vocabulario de tokens, sus fuentes y su modelo de temas. El aislamiento es por{" "}
            <strong className="text-sr-txt">prefijo de token</strong>, no por ámbito CSS.
          </>
        }
      >
        <Sample title="Los seis" code="SMARTROTOM_V3.md §0" col>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[40rem]">
              <div
                className={cn(
                  MONO_LABEL,
                  "grid grid-cols-[1.5fr_0.7fr_1.1fr_2fr] gap-4 border-b border-solid border-sr-line pb-[0.625rem] text-sr-txt-dim",
                )}
              >
                <span>Sistema</span>
                <span>Namespace</span>
                <span>Raíz de ámbito</span>
                <span>Respaldo</span>
              </div>
              {SYSTEMS.map((s) => (
                <div
                  key={s.ns}
                  className="grid grid-cols-[1.5fr_0.7fr_1.1fr_2fr] items-baseline gap-4 border-b border-dashed border-sr-line py-3 last:border-b-0"
                >
                  <span className="text-[0.875rem] leading-[1.3]">
                    <b className={cn(HEAD4, "block text-[0.875rem] text-sr-txt")}>{s.name}</b>
                    <small className="font-mono text-[0.625rem] leading-none text-sr-txt-dim">{s.what}</small>
                  </span>
                  <code className="font-mono text-[0.75rem] font-semibold leading-none text-sr-accent">{s.ns}</code>
                  <code className="font-mono text-[0.6875rem] leading-[1.4] text-sr-txt-muted">{s.scope}</code>
                  <span className="font-body text-[0.75rem] leading-[1.5] text-sr-txt-muted">{s.backing}</span>
                </div>
              ))}
            </div>
          </div>
        </Sample>

        <Sample
          title="Consecuencias"
          code="no las ignores"
          col
          note={
            <>
              Cuenta los espacios de nombres, no las apps: Mewtube y Mewtwitch comparten <code>mw-*</code>
              (un sistema, dos acentos), así que seis sistemas cubren seis apps más el chrome.
            </>
          }
        >
          <div className="grid w-full gap-3">
            {[
              [
                "sr-* es solo chrome",
                "Viste RotomNav, BreadcrumbNav, Settings, Loading y las tres primitivas de components/smartrotom/ui. Ninguna app lo usa.",
              ],
              [
                "Una primitiva solo es correcta dentro de su raíz",
                "Un componente nt-* fuera de .nt-app renderiza con variables CSS sin resolver. Lo porteado (overlays, toasts) hay que re-envolverlo en una capa con tema.",
              ],
              [
                "«Primitiva compartida de SmartRotom» es casi un mito",
                "La única librería genuinamente compartida es components/smartrotom/media/ui (Mewtube + Mewtwitch). El resto vive en el _components/ui de cada app.",
              ],
            ].map(([t, d]) => (
              <div key={t} className="border-l-4 border-l-sr-accent border-y-0 border-r-0 border-solid bg-sr-panel-2 py-3 px-4">
                <b className={cn(HEAD4, "block text-[0.8125rem] text-sr-txt")}>{t}</b>
                <span className="font-body text-[0.8125rem] leading-[1.6] text-sr-txt-muted">{d}</span>
              </div>
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="sr-color"
        kicker="Bases"
        title="Color"
        lead={
          <>
            Cada token <code>sr-*</code> es un alias: <code>--sr-accent</code> apunta a{" "}
            <code>--primary</code>, <code>--sr-panel</code> a <code>--layer-2</code>… Por eso el chrome
            hereda gratis los cinco temas del selector de Ajustes (Oscuro, Claro, Tulipán, Mizu, Oasis) sin
            una sola línea de CSS por tema.
          </>
        }
      >
        <Sample title="Paleta" code="tailwind.config · sr" col canvas={false}>
          <Swatches tokens={SR_TOKENS} />
        </Sample>

        <Sample
          title="Acento"
          code="--sr-accent-*"
          note={
            <>
              <code>accent-ink</code> es la tinta sobre relleno de acento (fija, casi negra) y{" "}
              <code>accent-line</code> un <code>color-mix</code> al 45 % para bordes tenues. Los usan{" "}
              <code>SmartRotomButton</code> y <code>SmartRotomBadge</code>.
            </>
          }
        >
          <span className="cut [--cut:7px] bg-sr-accent px-4 py-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sr-accent-ink">
            accent · ink
          </span>
          <span className="cut cut-edge-slant [--cut:7px] [--cut-line:var(--sr-accent-line)] border border-solid border-sr-accent-line bg-sr-accent-soft px-4 py-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-sr-accent-bright">
            accent-soft · line
          </span>
          <span className="font-body text-[0.875rem] text-sr-txt-muted">← cambia con el tema activo</span>
        </Sample>

        <Sample title="Estado" code="ok · warn · bad">
          {[
            ["OK", "border-l-sr-ok text-sr-ok"],
            ["Aviso", "border-l-sr-warn text-sr-warn"],
            ["Error", "border-l-sr-bad text-sr-bad"],
          ].map(([label, tone]) => (
            <span
              key={label}
              className={cn(
                "border-y-0 border-r-0 border-l-4 border-solid bg-sr-panel-2 px-4 py-[0.625rem] font-mono text-[0.75rem] font-semibold uppercase tracking-[0.1em]",
                tone,
              )}
            >
              {label}
            </span>
          ))}
        </Sample>
      </Section>

      <Section
        id="sr-tipografia"
        kicker="Bases"
        title="Tipografía"
        lead={
          <>
            No existe una familia <code>font-sr</code>: el chrome reutiliza el sistema tipográfico
            compartido —Saira Condensed para titulares, Saira para lectura, IBM Plex Mono para datos—.
            Las seis apps sí traen la suya (<code>font-sb</code>, <code>font-pk</code>…); el marco, no.
          </>
        }
      >
        <Sample title="Escala" code="Saira Condensed · Saira · IBM Plex Mono" col>
          <div className="grid w-full gap-[1.125rem]">
            {[
              [
                "Display / 800 italic / 40–72px",
                <span key="a" className={cn(DISPLAY, DISPLAY_EM, "text-sr-txt")} style={{ fontSize: 56 }}>
                  Componentes de <em>SmartRotom</em>
                </span>,
              ],
              [
                "Título / 800 italic / 30–42px",
                <span key="b" className={cn(DISPLAY, "text-sr-txt")} style={{ fontSize: 36 }}>
                  Seis sistemas
                </span>,
              ],
              [
                "Subtítulo / 700 / 14–22px",
                <h4 key="c" className={cn(HEAD4, "text-sr-txt")} style={{ fontSize: 20 }}>
                  Panel de ajustes
                </h4>,
              ],
              [
                "Primitiva / display 700 recto / 11–15px",
                <span
                  key="d"
                  className="font-display text-[0.875rem] font-bold not-italic uppercase leading-none tracking-[0.08em] text-sr-txt"
                >
                  Botones y badges nunca en cursiva
                </span>,
              ],
              [
                "Cuerpo / Saira 400 / 13–15px",
                <span key="e" className="max-w-[52ch] font-body text-[0.9375rem] leading-[1.6] text-sr-txt-muted">
                  El chrome es el marco alrededor de las apps: nav, migas, ajustes y estados de carga.
                </span>,
              ],
              [
                "Dato / Mono 500–600 / 10–13px",
                <span key="f" className={MONO_LABEL}>
                  Chrome · sr-* · 3 primitivas
                </span>,
              ],
            ].map(([meta, node], i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-baseline gap-2 border-b border-dashed border-sr-line pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[14.375rem_1fr] sm:gap-[1.375rem]"
              >
                <span className="font-mono text-[0.6875rem] font-medium leading-[1.6] text-sr-txt-dim">
                  {meta as React.ReactNode}
                </span>
                {node as React.ReactNode}
              </div>
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="sr-geometria"
        kicker="Bases"
        title="Geometría"
        lead={
          <>
            Nada de radios: la firma es el corte diagonal. Las cuatro utilidades{" "}
            <code>cut / cut-seal / cut-corner / cut-tag</code> son <strong className="text-sr-txt">globales</strong>{" "}
            (viven en <code>addComponents</code> de <code>tailwind.config.ts</code>, no las posee Boffmedia) y el
            chrome tira de ellas. El tamaño va por token: <code>--cut</code>, <code>--cut-lg</code>,{" "}
            <code>--cut-tag</code>.
          </>
        }
      >
        <Sample
          title="Cortes"
          code=".cut · .cut-seal · .cut-corner · .cut-tag"
          note={
            <>
              Sobrescribe el tamaño por instancia con una variante arbitraria: <code>[--cut:4px]</code>. Así lo
              hace <code>SmartRotomButton</code>, que baja a 7px en <code>size=&quot;sm&quot;</code> y sube a 11px
              en <code>lg</code>.
            </>
          }
        >
          {CUTS.map(([label, clip, token]) => (
            <div key={label} className="grid gap-[0.375rem]">
              <div
                className={cn(
                  "grid h-[4.5rem] w-[8.125rem] place-items-center border border-solid border-sr-line-2 bg-sr-panel-2 font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.08em] text-sr-txt-muted",
                  clip,
                )}
              >
                {label}
              </div>
              <code className="font-mono text-[0.625rem] leading-none text-sr-txt-dim">{token}</code>
            </div>
          ))}
        </Sample>

        <Sample title="Barra de acento" code="border-l-4" note="El recurso barato para marcar lo activo: nav, filas de menú y avisos.">
          <div className="grid w-full gap-2">
            {["Activo", "Inactivo"].map((s) => (
              <div
                key={s}
                className={cn(
                  "border-y-0 border-r-0 border-l-4 border-solid bg-sr-panel-2 py-[0.6875rem] px-4 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.1em]",
                  s === "Activo" ? "border-l-sr-accent text-sr-txt" : "border-l-sr-line text-sr-txt-dim",
                )}
              >
                {s}
              </div>
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
