"use client"

import * as React from "react"
import type { CSSProperties } from "react"
import { Sample, Section, Swatches } from "../showcase-shared"
import { Button, Chip, CountBadge, Icon } from "../../../chatapp/_components/ui"
import { ACCENTS, DEFAULT_ACCENT, hexToTriplet } from "../../../chatapp/_utils/theme"

// Two `.ca-app` roots side by side: the whole point of the ChatApp system is that the
// neutral ramp INVERTS between themes, and that only reads if you see both at once.
function ThemePair({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full grid-cols-1 lg:grid-cols-2">
      {(["light", "dark"] as const).map((t) => (
        <div key={t} className="ca-app bg-ca-panel p-[1.375rem] font-ca text-ca-50 antialiased" data-theme={t}>
          <div className="mb-4 font-ca-mono text-[0.625rem] uppercase tracking-[0.16em] text-ca-400">
            {t === "light" ? "Claro" : "Oscuro"}{" "}
            <span className="text-ca-500">data-theme=&quot;{t}&quot;</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">{children}</div>
        </div>
      ))}
    </div>
  )
}

// `--ca-accent-soft` and `--ca-bubble-out` are color-mixed *in the declaration* of the
// `.ca-app` rule, and custom properties substitute where they are declared — so a nested
// div overriding `--ca-accent` would recolour `bg-ca-accent` but NOT the derived tokens.
// The runtime triplet has to sit on a `.ca-app` element, exactly like `chatapp/layout.tsx`.
function AccentRoot({
  theme,
  triplet,
  children,
}: {
  theme: "light" | "dark"
  triplet: string
  children: React.ReactNode
}) {
  return (
    <div
      className="ca-app min-w-[16.25rem] flex-1 rounded-[12px] bg-ca-panel p-4 font-ca text-ca-50 antialiased"
      data-theme={theme}
      style={{ "--ca-accent": triplet } as CSSProperties}
    >
      {children}
    </div>
  )
}

const RAMP = [
  ["bg-ca-50", "Texto principal"],
  ["bg-ca-100", "Texto fuerte"],
  ["bg-ca-200", "Texto"],
  ["bg-ca-300", "Texto suave"],
  ["bg-ca-400", "Atenuado"],
  ["bg-ca-500", "Sutil"],
  ["bg-ca-600", "Borde fuerte"],
  ["bg-ca-700", "Borde"],
  ["bg-ca-800", "Línea"],
  ["bg-ca-900", "Fondo"],
  ["bg-ca-950", "Fondo profundo"],
] as const

const SURFACES = [
  ["bg-ca-panel", "Panel"],
  ["bg-ca-header", "Cabecera"],
  ["bg-ca-search-bg", "Búsqueda"],
  ["bg-ca-input-bg", "Entrada"],
  ["bg-ca-bubble-in", "Burbuja entrante"],
  ["bg-ca-bubble-out", "Burbuja saliente"],
  ["bg-ca-wallpaper", "Fondo de chat"],
] as const

const STATUS = [
  ["bg-ca-online", "En línea"],
  ["bg-ca-tick-read", "Tick leído"],
  ["bg-ca-info", "Info"],
  ["bg-ca-error", "Error"],
  ["bg-ca-warning", "Aviso"],
] as const

const ACCENT_TOKENS = [
  ["bg-ca-accent", "Acento"],
  ["bg-ca-accent-soft", "Acento suave"],
  ["bg-ca-on-accent", "Sobre acento"],
  ["bg-ca-bubble-out", "Burbuja saliente"],
] as const

export function CaBasesChapter() {
  const [accent, setAccent] = React.useState<string>(DEFAULT_ACCENT)
  const triplet = hexToTriplet(accent)

  return (
    <>
      <Section
        id="ca-color"
        kicker="ChatApp"
        title="Color y temas"
        lead="ChatApp es el único sistema de SmartRotom con claro y oscuro de verdad: no un filtro, sino una rampa neutra que se invierte. En claro, ca-50 es casi negro y ca-950 es blanco; en oscuro es al revés. Los componentes no saben en qué tema están — siempre piden ca-50 para el texto y ca-900 para el fondo."
      >
        <Sample app="ca" title="Rampa neutra" code="--ca-50 … --ca-950" padded={false} canvas={false}>
          <ThemePair>
            <Swatches tokens={RAMP} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Superficies"
          code="--ca-panel · --ca-bubble-in …"
          padded={false}
          note={
            <>
              Las superficies semánticas se declaran por tema en el plugin <code>.ca-app</code> de{" "}
              <code>tailwind.config.ts</code>. <code>bubble-out</code> no es un color literal: se deriva del acento con{" "}
              <code>color-mix</code> (20&nbsp;% sobre blanco en claro, 42&nbsp;% sobre <code>#0b141a</code> en oscuro).
            </>
          }
          canvas={false}
        >
          <ThemePair>
            <Swatches tokens={SURFACES} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Estado"
          code="--ca-online · --ca-tick-read …"
          padded={false}
          note="Los colores de estado son constantes: no cambian con el tema. El verde de «en línea» y el azul del doble tick son los mismos en claro y en oscuro." canvas={false}>
          <ThemePair>
            <Swatches tokens={STATUS} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Fondo de conversación"
          code=".ca-doodle"
          padded={false}
          note={
            <>
              El fondo de chat son dos capas: <code>bg-ca-wallpaper</code> (color plano) y la utilidad{" "}
              <code>.ca-doodle</code>, una máscara SVG repetida que se tiñe con <code>--ca-doodle-color</code>. Cálido y
              oscuro sobre <code>#0b141a</code>; cálido y claro sobre <code>#efeae2</code>.
            </>
          }
        >
          <ThemePair>
            <div className="relative h-[9.375rem] w-full overflow-hidden rounded-[12px] bg-ca-wallpaper">
              <div className="ca-doodle pointer-events-none absolute inset-0" />
              <div className="relative flex h-full items-center justify-center">
                <span className="rounded-ca-md bg-ca-header px-[0.8125rem] py-[0.3125rem] text-[0.78125rem] text-ca-300 shadow-[0_1px_1px_rgba(0,0,0,.08)]">
                  Hoy
                </span>
              </div>
            </div>
          </ThemePair>
        </Sample>
      </Section>

      <Section
        id="ca-acento"
        kicker="ChatApp"
        title="Acento"
        lead="Un único acento, elegido por la persona usuaria en tiempo de ejecución. --ca-accent es un triplete RGB en el style del root .ca-app; de él salen el acento suave (para texto sobre panel) y el color de la burbuja saliente. Cambiar ocho caracteres repinta la app entera."
      >
        <Sample
          app="ca"
          title="Acento y derivados"
          code="--ca-accent · --ca-accent-soft · --ca-on-accent"
          padded={false}
          note={
            <>
              <code>accent-soft</code> se mezcla hacia negro en claro (90&nbsp;%) y hacia blanco en oscuro (68&nbsp;%),
              para que el acento siga legible como texto en ambos temas. Ese es el único ajuste manual: todo lo demás se
              deriva.
            </>
          }
          canvas={false}
        >
          <ThemePair>
            <Swatches tokens={ACCENT_TOKENS} />
          </ThemePair>
        </Sample>

        <Sample
          app="ca"
          title="Acento en tiempo de ejecución"
          code="style={{ '--ca-accent': triplet }}"
          col
          note={
            <>
              Los ocho acentos vienen de <code>chatapp/_utils/theme.ts</code>; <code>hexToTriplet()</code> convierte el
              hex al triplete que espera la variable. El triplete tiene que ir en el elemento <code>.ca-app</code>: las
              variables derivadas se sustituyen donde se declaran, así que un div interior recolorearía{" "}
              <code>bg-ca-accent</code> pero no la burbuja saliente.
            </>
          }
        >
          <div className="flex w-full flex-wrap items-center gap-2">
            {ACCENTS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setAccent(hex)}
                aria-label={`Acento ${hex}`}
                aria-pressed={accent === hex}
                className="h-8 w-8 rounded-full border-2 border-solid transition-transform duration-[120ms] hover:scale-110"
                style={{ background: hex, borderColor: accent === hex ? hex : "transparent", outline: accent === hex ? "2px solid currentColor" : "none", outlineOffset: 2 }}
              />
            ))}
            <span className="ml-auto font-ca-mono text-[0.6875rem] text-ca-400">
              --ca-accent: {triplet}
            </span>
          </div>

          <div className="flex w-full flex-wrap gap-4">
            {(["light", "dark"] as const).map((t) => (
              <AccentRoot key={t} theme={t} triplet={triplet}>
                <div className="mb-3 font-ca-mono text-[0.625rem] uppercase tracking-[0.16em] text-ca-400">
                  {t === "light" ? "Claro" : "Oscuro"}
                </div>
                <div className="mb-3 flex flex-col gap-1.5">
                  <span className="max-w-[80%] self-start rounded-ca-md bg-ca-bubble-in px-[0.5625rem] py-1.5 text-[0.8875rem] text-ca-bubble-in-text shadow-ca-bubble">
                    ¿Vamos a la raid de las 8?
                  </span>
                  <span className="max-w-[80%] self-end rounded-ca-md bg-ca-bubble-out px-[0.5625rem] py-1.5 text-[0.8875rem] text-ca-bubble-out-text shadow-ca-bubble">
                    Voy de camino
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button>Enviar</Button>
                  <Button variant="ghost">
                    <Icon name="phone" size={16} /> Llamar
                  </Button>
                  <Chip active>Grupos</Chip>
                  <CountBadge count={7} />
                </div>
              </AccentRoot>
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
