"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"

const NEONS = [
  ["bg-ar-cyan", "cyan · sistema"],
  ["bg-ar-magenta", "magenta · en vivo"],
  ["bg-ar-violet", "violet · raro"],
  ["bg-ar-amber", "amber · premio"],
  ["bg-ar-lime", "lime · confirmado"],
  ["bg-ar-cyan-2", "cyan-2"],
  ["bg-ar-magenta-2", "magenta-2"],
  ["bg-ar-violet-2", "violet-2"],
  ["bg-ar-danger", "danger"],
] as const

const VOID = [
  ["bg-ar-bg", "bg · lienzo"],
  ["bg-ar-void", "void · pantalla"],
  ["bg-ar-void-2", "void-2"],
  ["bg-ar-void-3", "void-3 · mueble"],
] as const

const INK = [
  ["bg-ar-ink", "ink · texto"],
  ["bg-ar-ink-dim", "ink-dim · cuerpo"],
  ["bg-ar-ink-muted", "ink-muted · dato"],
] as const

export function ArBasesChapter() {
  return (
    <>
      <Section
        id="ar-color"
        kicker="Arcade"
        title="Color"
        lead="Un vacío violeta muy oscuro iluminado por cinco neones. No hay tema claro: el arcade es de una sola cara y no consulta el selector de temas de la plataforma. Los cinco neones no son una rampa, son roles —cada uno significa algo—."
      >
        <Sample
          title="Neones"
          code="ar-cyan · ar-magenta · ar-violet · ar-amber · ar-lime"
          app="ar"
          canvas={false}
          note="Cian es el sistema (UI, foco, primario). Magenta es lo que está vivo o caliente. Violeta es lo raro y las cajas. Ámbar es la recompensa y la moneda. Lima es lo confirmado. Los sufijos `-2` son la versión clara, para texto sobre fondo oscuro."
        >
          <Swatches tokens={NEONS} />
        </Sample>

        <Sample
          title="Vacío y tinta"
          code="ar-bg · ar-void … ar-void-3 · ar-ink*"
          app="ar"
          canvas={false}
          note="El vacío hace de lienzo (`ar-bg`), de pantalla CRT (`ar-void`) y de mueble de la máquina (`ar-void-3`). Los paneles no usan estos tokens directamente: son cristales semitransparentes con degradado propio, ver «Paneles»."
        >
          <Swatches tokens={[...VOID, ...INK]} />
        </Sample>

        <Sample
          title="Lienzo"
          code="ar-canvas"
          app="ar"
          note="Dos focos de neón —violeta arriba a la derecha, magenta abajo a la izquierda— sobre un degradado violeta. Es el fondo de toda la app; lo pinta el layout, no las pantallas."
          padded={false}
        >
          <div className="h-[10rem] w-full" />
        </Sample>
      </Section>

      <Section
        id="ar-tipografia"
        kicker="Arcade"
        title="Tipografía"
        lead="Tres voces. Press Start 2P es la tipografía de la marquesina: píxel puro, un solo grosor y una caja por glifo enorme, así que sólo aparece pequeña —rótulos, títulos, marcadores—. Space Grotesk lee. JetBrains Mono cuenta."
      >
        <Sample title="Escala" code="font-ar-display · font-ar · font-ar-mono" app="ar" col>
          <div className="grid w-full gap-[1.125rem]">
            {[
              [
                "Marquesina / Press Start 2P / 18–28px",
                <span key="a" className="ar-marquee-text font-ar-display text-[1.5rem] leading-tight">
                  TU ESTACIÓN RETRO
                </span>,
              ],
              [
                "Título / Press Start 2P / 13–18px",
                <span key="b" className="font-ar-display text-[1rem] leading-relaxed text-ar-ink">
                  Gira Voltorb
                </span>,
              ],
              [
                "Rótulo / Press Start 2P / 8–10px",
                <span key="c" className="font-ar-display text-[0.5625rem] uppercase tracking-[0.18em] text-ar-cyan">
                  ▸ Racha semanal
                </span>,
              ],
              [
                "Cuerpo / Space Grotesk 400–700 / 12–14px",
                <span key="d" className="max-w-[52ch] font-ar text-[0.8125rem] leading-relaxed text-ar-ink-dim">
                  Juega los minijuegos de SmartRotom, sube tu racha y desbloquea cajas del banner activo.
                </span>,
              ],
              [
                "Dato / JetBrains Mono 500–700 / 10–13px",
                <span key="e" className="font-ar-mono text-[0.75rem] font-bold tabular-nums text-ar-amber">
                  REINICIA EN 12h 24m
                </span>,
              ],
              [
                "Marcador / Press Start 2P + glow",
                <span key="f" className="ar-glow-cyan font-ar-display text-[1.75rem] text-ar-ink">
                  ×108
                </span>,
              ],
            ].map(([meta, node], i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-baseline gap-2 border-b border-dashed border-white/[0.06] pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[16.25rem_1fr] sm:gap-[1.375rem]"
              >
                <span className={cn(MONO_LABEL, "font-ar-mono text-ar-ink-muted")}>
                  {meta as React.ReactNode}
                </span>
                {node as React.ReactNode}
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="Nunca engordes el píxel"
          code="font-ar-display"
          app="ar"
          note="Press Start 2P sólo tiene un peso (400). Pedirle `font-bold` hace que el navegador lo sintetice y el píxel se emborrona. Para dar énfasis, usa color o un glow —nunca grosor—."
        >
          <span className="font-ar-display text-[0.875rem] text-ar-ink">Correcto</span>
          <span className="ar-glow-magenta font-ar-display text-[0.875rem] text-ar-magenta-2">Énfasis</span>
        </Sample>
      </Section>

      <Section
        id="ar-crt"
        kicker="Arcade"
        title="Capa CRT"
        lead="Lo que convierte un panel oscuro en una máquina recreativa. Son clases de efecto del plugin de Tailwind, no utilidades sueltas: cada una es un pseudo-elemento con máscaras que Tailwind no sabe expresar."
      >
        <Sample
          title="Scanlines y viñeta"
          code="ar-scanlines · ar-vignette"
          app="ar"
          note="La intensidad de las scanlines es un ajuste del jugador: `data-scanlines` en la raíz `.ar-app` («off» · «subtle» · «strong») reescribe `--ar-scan`. Ajustes → Cabina la controla."
          grid
        >
          <div className="ar-scanlines grid h-28 place-items-center rounded-xl border border-ar-cyan/30 bg-ar-void font-ar-display text-[0.6875rem] text-ar-cyan">
            SCANLINES
          </div>
          <div className="ar-scanlines ar-vignette relative grid h-28 place-items-center rounded-xl border border-ar-magenta/30 bg-ar-void font-ar-display text-[0.6875rem] text-ar-magenta-2">
            + VIÑETA
          </div>
        </Sample>

        <Sample
          title="Horizonte"
          code="ar-horizon"
          app="ar"
          note="La carretera synthwave: una lámina magenta→cian inclinada en perspectiva y enmascarada en rejilla, más la línea del horizonte. Va en un padre `relative` y el contenido se sube por encima con `relative z-[2]`."
          padded={false}
        >
          <div className="relative h-[11.25rem] w-full overflow-hidden rounded-xl border border-ar-violet/25 bg-ar-void">
            <div aria-hidden className="ar-horizon" />
            <div className="relative z-[2] grid h-full place-items-center font-ar-display text-[0.75rem] text-ar-ink">
              HORIZONTE
            </div>
          </div>
        </Sample>

        <Sample
          title="Aberración y brillos"
          code="ar-chrom · ar-glow-*"
          app="ar"
          note="`ar-chrom` desalinea los cañones rojo y azul del tubo: un píxel de magenta a un lado, uno de cian al otro. Es el efecto de «título encendido» y se reserva para titulares y estados hover."
        >
          <span className="ar-chrom font-ar-display text-[0.9375rem] text-ar-ink">ABERRACIÓN</span>
          <span className="ar-glow-cyan font-ar-display text-[0.9375rem] text-ar-cyan">CIAN</span>
          <span className="ar-glow-magenta font-ar-display text-[0.9375rem] text-ar-magenta-2">MAGENTA</span>
          <span className="ar-glow-amber font-ar-display text-[0.9375rem] text-ar-amber">ÁMBAR</span>
        </Sample>

        <Sample
          title="Movimiento"
          code="animate-ar-blink · animate-ar-float · animate-ar-ring · animate-ar-pulse"
          app="ar"
          note={
            <>
              Todas las animaciones se apagan con <code>motion-reduce:animate-none</code> y, además,
              con el interruptor «Reducir motion» de Ajustes, que pone{" "}
              <code>data-motion=&quot;off&quot;</code> en la raíz.
            </>
          }
        >
          <span className="font-ar-display text-[0.625rem] text-ar-amber motion-reduce:animate-none animate-ar-blink">
            INSERT COIN ●
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-lg border border-ar-violet/50 bg-ar-violet/10 font-ar-display text-[1rem] text-ar-violet-2 motion-reduce:animate-none animate-ar-float">
            ◈
          </span>
          <span className="relative grid h-12 w-12 place-items-center rounded-lg border border-ar-cyan/50 bg-ar-cyan/10 font-ar-display text-[1rem] text-ar-cyan">
            ★
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-0.5 rounded-[10px] border-2 border-ar-cyan motion-reduce:animate-none animate-ar-ring"
            />
          </span>
          <span
            aria-hidden
            className="h-3 w-3 rounded-full bg-ar-lime shadow-[0_0_8px_rgb(var(--ar-lime))] motion-reduce:animate-none animate-ar-pulse"
          />
        </Sample>
      </Section>
    </>
  )
}
