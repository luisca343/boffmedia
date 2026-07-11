"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DISPLAY, DISPLAY_EM, HEAD4, MONO_LABEL, Sample, Section } from "../showcase-shared"
import { Chip, Kicker, Panel } from "@/components/boffmedia/primitives"

export function BasesChapter() {

  return (
    <>
            <Section id="color" kicker="Bases" title="Color" lead="Grafito profundo con paneles de acero y un único acento: el naranja Boffmedia. Los tonos semánticos se reservan para estado, nunca para decorar.">
              <Sample title="Paleta" code="tokens.css">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full">
                  {(
                    [
                      ["--bg", "Fondo"],
                      ["--panel", "Panel"],
                      ["--line", "Línea"],
                      ["--text", "Texto"],
                      ["--muted", "Atenuado"],
                      ["--accent", "Naranja"],
                      ["--ok", "OK"],
                      ["--warn", "Aviso"],
                      ["--bad", "Error"],
                      ["--info", "Info"],
                    ] as const
                  ).map(([v, n]) => (
                    <div key={v} className="border border-solid border-line">
                      <i className="block h-16" style={{ background: `var(${v})` }} />
                      <div className="py-[9px] px-[11px] font-mono text-[10px] font-medium leading-[1.5] text-txt-muted">
                        <b className="block text-txt font-semibold">{n}</b>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </Sample>
              <Sample title="Temas" note="Oscuro es nativo. El claro conserva la barra superior negra de retransmisión y oscurece el naranja para contraste AA.">
                <Chip>data-theme=&quot;dark&quot;</Chip>
                <Chip>data-theme=&quot;light&quot;</Chip>
                <span className="text-txt-muted text-[14px]">← cambia con el interruptor de la barra</span>
              </Sample>
            </Section>

            <Section id="tipografia" kicker="Bases" title="Tipografía" lead="Tres voces: Saira Condensed Italic para titulares (la voz de la señal), Saira para lectura e IBM Plex Mono para datos, etiquetas y todo lo operativo.">
              <Sample title="Escala" code="Saira Condensed · Saira · IBM Plex Mono" col>
                <div className="grid gap-[18px] w-full">
                  {[
                    ["Display / 800 italic / 72–148px", <span key="a" className={cn(DISPLAY, DISPLAY_EM)} style={{ fontSize: 64 }}>Señal <em>en directo</em></span>],
                    ["Título / 800 italic / 42–64px", <span key="b" className={DISPLAY} style={{ fontSize: 40 }}>Eventos &amp; Ranking</span>],
                    ["Subtítulo / 700 / 19–26px", <h4 key="c" className={HEAD4} style={{ fontSize: 22 }}>Torneo Pixelmon Wingull 2</h4>],
                    ["Cuerpo / Saira 400 / 15–17px", <span key="d" className="max-w-[52ch]">Sumérgete en experiencias inmersivas y forma parte de una comunidad apasionada.</span>],
                    ["Dato / Mono 500–600 / 10–15px", <span key="e" className={MONO_LABEL}>Torneo · Servidor Wingull · 96 plazas</span>],
                  ].map(([meta, node], i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[210px_1fr] gap-2 sm:gap-[22px] items-baseline border-b border-dashed border-line pb-4 last:border-b-0 last:pb-0">
                      <span className="font-mono text-[11px] font-medium leading-[1.6] text-txt-dim">{meta as React.ReactNode}</span>
                      {node as React.ReactNode}
                    </div>
                  ))}
                </div>
              </Sample>
              <Sample title="Kicker" code="<Kicker>">
                <Kicker>Comunidad en acción</Kicker>
                <Kicker>Producto destacado · Próximamente</Kicker>
              </Sample>
            </Section>

            <Section id="geometria" kicker="Bases" title="Geometría" lead="Nada de radios: la firma es el corte diagonal. Tres cortes fijos y una barra de acento de 4px. El corte siempre cae hacia la derecha, como un banner de retransmisión.">
              <Sample title="Cortes" code=".cut · .cut-tag · .cut-corner">
                <div className="flex gap-[22px] flex-wrap">
                  {[
                    ["CUT 10px", "cut"],
                    ["TAG 8px", "cut-tag"],
                    ["CORNER 16px", "cut-corner"],
                  ].map(([l, clip]) => (
                    <div key={l} className={cn("w-[130px] h-[72px] bg-panel-2 border border-solid border-line-2 grid place-items-center font-mono text-[10px] font-medium leading-none text-txt-muted tracking-[0.08em]", clip)}>
                      {l}
                    </div>
                  ))}
                  <div className="w-[130px] h-[72px] bg-panel-2 border border-solid border-line-2 border-l-4 border-l-accent grid place-items-center font-mono text-[10px] font-medium leading-none text-txt-muted tracking-[0.08em]">
                    BARRA 4px
                  </div>
                </div>
              </Sample>
              <Sample title="Espaciado" code="ritmo 4px" col>
                <div className="w-full overflow-x-auto">
                <div className="grid gap-[10px] min-w-max">
                  {(
                    [
                      [4, "micro"],
                      [8, "chip"],
                      [16, "grupo"],
                      [24, "tarjeta"],
                      [40, "bloque"],
                      [84, "sección"],
                    ] as const
                  ).map(([n, l]) => (
                    <div key={n} className="flex items-center gap-4 whitespace-nowrap font-mono text-[11px] font-medium leading-none text-txt-muted">
                      <i className="h-[18px] bg-accent-soft border border-solid border-accent-line" style={{ width: n * 3 }} />
                      {n}px · {l}
                    </div>
                  ))}
                </div>
                </div>
              </Sample>
            </Section>
    </>
  )
}
