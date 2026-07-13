"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ACCENTS, type RookerAccent } from "@/app/smartrotom/rooker/_utils/display"
import { Sample, Section, Swatches } from "../showcase-shared"

/**
 * Rooker's foundations. The one thing worth reading twice is the canvas story: three,
 * not two, and the third is not a theme.
 */
export function RkBasesChapter() {
  const [accent, setAccent] = React.useState<RookerAccent>("azul")

  return (
    <>
      <Section
        id="rk-color"
        kicker="Rooker"
        title="Color y lienzos"
        lead={
          <>
            Tres lienzos donde el resto de las apps tiene dos: <code>light</code>,{" "}
            <code>dim</code> y <code>lightsout</code>. No es un tema de más. El selector de la
            plataforma sigue decidiendo claro contra oscuro (§2b); lo que elige el lector es{" "}
            <em>qué</em> oscuro — Tenue (un azul marino desaturado) u Oscuro (negro puro, para
            OLED). <code>data-theme</code> lleva el lienzo ya resuelto, nunca una preferencia que
            la app se haya inventado.
          </>
        }
      >
        <Sample title="Tenue · el lienzo por defecto" code=".rk-app" app="rk" canvas={false}>
          <Swatches
            tokens={[
              ["bg-rk-bg", "Lienzo"],
              ["bg-rk-card", "Tarjeta · rail, campo"],
              ["bg-rk-elevated", "Elevado · bandeja"],
              ["bg-rk-line", "Filete"],
              ["bg-rk-line-strong", "Filete fuerte"],
            ]}
          />
        </Sample>

        <Sample title="Claro" code='.rk-app[data-theme="light"]' app="rk" theme="light" canvas={false}>
          <Swatches
            tokens={[
              ["bg-rk-bg", "Lienzo"],
              ["bg-rk-card", "Tarjeta"],
              ["bg-rk-elevated", "Elevado"],
              ["bg-rk-line", "Filete"],
              ["bg-rk-line-strong", "Filete fuerte"],
            ]}
          />
        </Sample>

        <Sample
          title="Oscuro · negro puro"
          code='.rk-app[data-theme="lightsout"]'
          app="rk"
          theme="lightsout"
          canvas={false}
        >
          <Swatches
            tokens={[
              ["bg-rk-bg", "Lienzo"],
              ["bg-rk-card", "Tarjeta"],
              ["bg-rk-elevated", "Elevado"],
              ["bg-rk-line", "Filete"],
              ["bg-rk-line-strong", "Filete fuerte"],
            ]}
          />
        </Sample>

        <Sample
          title="Colores de acción · constantes"
          code="--rk-heart · --rk-rt · --rk-live"
          app="rk"
          note="Estos siete no siguen al acento ni cambian con el lienzo, y ésa es toda la regla: un Retrino es verde y un me gusta es rosa. Recolorearlos con el acento destruiría el significado que el lector ya trae aprendido de otra red."
        >
          <Swatches
            tokens={[
              ["bg-rk-heart", "Me gusta"],
              ["bg-rk-ball", "¡Captura!"],
              ["bg-rk-choque", "Choque"],
              ["bg-rk-shiny", "Shiny"],
              ["bg-rk-fuego", "Fueguito"],
              ["bg-rk-rt", "Retrino"],
              ["bg-rk-live", "En vivo"],
            ]}
          />
        </Sample>
      </Section>

      <Section
        id="rk-acento"
        kicker="Rooker"
        title="Acento"
        lead={
          <>
            Seis acentos, elegidos por el lector en Pantalla. <code>--rk-accent</code> es un
            triplete RGB en tiempo de ejecución, así que toda superficie de marca se deriva de él
            por el canal alfa de Tailwind (<code>bg-rk-accent/12</code>): cambias una variable y se
            repinta la línea de tiempo entera. <code>--rk-accent-fg</code> viaja con él porque el
            amarillo y el verde necesitan tinta casi negra encima — eso es contraste, no estética.
          </>
        }
      >
        <Sample
          title="Los seis"
          code='style={{ "--rk-accent": "29 155 240" }}'
          app="rk"
          note="El botón, el enlace, la pestaña activa y el anillo de foco son el mismo token. Pulsa un color para verlo repintar la muestra."
        >
          <div
            className="rk-app w-full rounded-xl border border-rk-line bg-rk-bg p-4"
            style={
              {
                "--rk-accent": ACCENTS[accent].rgb,
                "--rk-accent-fg": ACCENTS[accent].fg,
              } as React.CSSProperties
            }
          >
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(ACCENTS) as RookerAccent[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  aria-label={ACCENTS[key].label}
                  aria-pressed={accent === key}
                  style={{ background: `rgb(${ACCENTS[key].rgb})` }}
                  className={cn(
                    "h-9 w-9 rounded-full transition-transform hover:scale-110",
                    accent === key && "ring-2 ring-rk-fg ring-offset-2 ring-offset-rk-bg",
                  )}
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button className="rounded-rk-pill bg-rk-accent px-[18px] py-2 text-[14px] font-bold text-rk-accent-fg">
                Trinar
              </button>
              <span className="text-[14px] text-rk-accent">#NidoCup</span>
              <span className="rounded-rk-pill bg-rk-accent/12 px-3 py-1 text-[13px] font-bold text-rk-accent">
                Acento suave
              </span>
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="rk-tipografia"
        kicker="Rooker"
        title="Tipografía"
        lead={
          <>
            Rooker es la única de las trece cuya cara de texto es la del <em>sistema del lector</em>.
            Una línea de tiempo debe leerse como el aparato donde se lee. Chirp (Hanken Grotesk,
            variable 400–900, auto-alojada) es la alternativa opcional de Pantalla. No hay cara de
            display: la jerarquía se hace con peso, nunca con una segunda familia.
          </>
        }
      >
        <Sample title="Las dos caras" code="font-rk · font-rk-chirp" app="rk">
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-rk-fg-subtle">
                Sistema (por defecto)
              </div>
              <p className="font-rk text-[19px] text-rk-fg">
                DESPUÉS DE 4.200 ENCUENTROS. POR FIN.
              </p>
            </div>
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-rk-fg-subtle">
                Chirp · Hanken Grotesk
              </div>
              <p className="font-rk-chirp text-[19px] text-rk-fg">
                DESPUÉS DE 4.200 ENCUENTROS. POR FIN.
              </p>
            </div>
          </div>
        </Sample>

        <Sample
          title="Escala"
          code="15px cuerpo · 18px detalle · 20px nav"
          app="rk"
          note="El cuerpo de un trino baja a 14px en densidad compacta; el trino abierto sube a 18px. Es el mismo texto en dos rangos, no dos estilos."
        >
          <div className="space-y-2">
            <p className="text-[20px] font-extrabold text-rk-fg">20 · navegación activa</p>
            <p className="text-[18px] text-rk-fg">18 · el trino abierto</p>
            <p className="text-[15px] text-rk-fg">15 · el trino en la línea de tiempo</p>
            <p className="text-[14px] text-rk-fg-muted">14 · compacto</p>
            <p className="text-[13px] text-rk-fg-subtle">13 · contadores y sellos de tiempo</p>
          </div>
        </Sample>
      </Section>

      <Section
        id="rk-geometria"
        kicker="Rooker"
        title="Geometría"
        lead={
          <>
            Dos valores y ya: <strong>todo contenedor es una tarjeta de 16px</strong> y{" "}
            <strong>todo control es una píldora completa</strong>. <code>rk-sm</code> existe sólo
            para lo diminuto y casi cuadrado (el aspa que limpia la búsqueda).
          </>
        }
      >
        <Sample title="Radios" code="rounded-rk · rounded-rk-pill" app="rk">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid h-20 w-28 place-items-center rounded-rk border border-rk-line bg-rk-card text-[12px] text-rk-fg-muted">
              rk · 16px
            </div>
            <div className="grid h-20 w-28 place-items-center rounded-rk-md border border-rk-line bg-rk-card text-[12px] text-rk-fg-muted">
              rk-md · 12px
            </div>
            <div className="grid h-10 w-32 place-items-center rounded-rk-pill bg-rk-accent text-[13px] font-bold text-rk-accent-fg">
              rk-pill
            </div>
            <div className="grid h-8 w-16 place-items-center rounded-rk-sm border border-rk-line bg-rk-card text-[11px] text-rk-fg-muted">
              rk-sm
            </div>
          </div>
        </Sample>
      </Section>
    </>
  )
}
