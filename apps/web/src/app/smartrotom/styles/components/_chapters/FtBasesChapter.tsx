"use client"

import * as React from "react"
import { Sample, Section, Swatches } from "../showcase-shared"

const PAPER = [
  ["bg-ft-paper", "paper · el papel"],
  ["bg-ft-paper-2", "paper-2 · el pie"],
  ["bg-ft-paper-dark", "paper-dark · portada"],
  ["bg-ft-ink", "ink · la tinta"],
] as const

const ACCENTS = [
  ["bg-ft-pink", "pink · primario"],
  ["bg-ft-yellow", "yellow · Furret"],
  ["bg-ft-cyan", "cyan"],
  ["bg-ft-purple", "purple"],
  ["bg-ft-orange", "orange"],
  ["bg-ft-lime", "lime"],
] as const

const SOFTS = [
  ["bg-ft-pink-soft", "pink-soft"],
  ["bg-ft-yellow-soft", "yellow-soft"],
  ["bg-ft-cyan-soft", "cyan-soft"],
  ["bg-ft-purple-soft", "purple-soft"],
  ["bg-ft-orange-soft", "orange-soft"],
  ["bg-ft-red", "red"],
] as const

export function FtBasesChapter() {
  return (
    <>
      <Section
        id="ft-color"
        kicker="Furret Today"
        title="Color"
        lead="Papel de periódico crema, tinta de cómic casi negra y seis colores planos que se comportan como tintas directas de imprenta. Es el único sistema de SmartRotom que sólo existe en claro: el papel ES el diseño, así que la app ignora el selector de temas. La portada oscura es una sección, no un tema."
      >
        <Sample
          title="Papel y tinta"
          code="ft-paper · ft-paper-2 · ft-paper-dark · ft-ink"
          app="ft"
          canvas={false}
          note="El fondo de `.ft-app` no es un color plano sino un degradado de `paper` a `paper-2`: la prensa cargaba más tinta al pie de la página. `paper-dark` es la portada de medianoche."
        >
          <Swatches tokens={PAPER} />
        </Sample>

        <Sample
          title="Las seis tintas"
          code="ft-pink · ft-yellow · ft-cyan · ft-purple · ft-orange · ft-lime"
          app="ft"
          canvas={false}
          note="El acento de un artículo se DERIVA de su sección (la API no guarda color), así que es un dato — y por eso nunca se interpola en una clase. Se aplica siempre con los mapas literales de `_utils/accents.ts` (§4). Rosa y morado llevan texto blanco; los otros cuatro, tinta."
        >
          <Swatches tokens={ACCENTS} />
        </Sample>

        <Sample
          title="Tintas suaves"
          code="ft-*-soft · ft-red"
          app="ft"
          canvas={false}
          note="Las versiones lavadas, para fondos de bloque (el pie del artículo) donde la tinta plena taparía el texto."
        >
          <Swatches tokens={SOFTS} />
        </Sample>
      </Section>

      <Section
        id="ft-tipografia"
        kicker="Furret Today"
        title="Tipografía"
        lead="Cuatro caras, cada una con un trabajo. Bangers grita los titulares, Fraunces (serif, cursiva) pone la voz del redactor, Space Grotesk es el cuerpo, e Inter carga todas las etiquetas en versalitas donde Bangers sería ilegible."
      >
        <Sample
          title="Las cuatro caras"
          code="font-ft-display · font-ft-deck · font-ft · font-ft-ui"
          app="ft"
          note="Bangers tiene UN solo peso (400): nunca se le pide otro. Fraunces es variable 400–900 y casi siempre va en cursiva."
        >
          <div className="grid gap-5">
            <div>
              <div className="font-ft-ui mb-1 text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
                display · Bangers
              </div>
              <div className="font-ft-display text-[2.75rem] leading-[0.95]">
                La Dinastía Furret
              </div>
            </div>
            <div>
              <div className="font-ft-ui mb-1 text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
                deck · Fraunces
              </div>
              <div className="font-ft-deck text-xl italic text-ft-deck">
                Cómo un Pokémon de tipo normal se convirtió en la mascota de toda una
                comunidad.
              </div>
            </div>
            <div>
              <div className="font-ft-ui mb-1 text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
                cuerpo · Space Grotesk
              </div>
              <div className="font-ft text-base text-ft-body">
                Hay Pokémon que ganan torneos y Pokémon que ganan corazones.
              </div>
            </div>
            <div>
              <div className="font-ft-ui mb-1 text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-ft-pink">
                ui · Inter
              </div>
              <div className="font-ft-ui text-[0.8125rem] font-medium uppercase tracking-[0.04em] text-ft-ink/70">
                Portada · Comunidad · 12 min
              </div>
            </div>
          </div>
        </Sample>

        <Sample
          title="Tinta y número"
          code="ft-ink-stroke · ft-stamp"
          app="ft"
          note="El contorno de tinta se dibuja con `-webkit-text-stroke` y `paint-order: stroke fill`, para que el trazo quede DETRÁS del relleno y no se coma la letra. `ft-stamp` es el numeral rosa que abre cada sección."
        >
          <div className="flex flex-wrap items-end gap-8">
            <span className="ft-stamp">01</span>
            <span className="ft-stamp">02</span>
            <span className="font-ft-display ft-ink-stroke text-[3.25rem] text-ft-yellow">
              ¡POW!
            </span>
          </div>
        </Sample>
      </Section>

      <Section
        id="ft-texturas"
        kicker="Furret Today"
        title="Texturas y tramas"
        lead="La trama de puntos Ben-Day es la textura que sostiene todo el sistema. Es un `radial-gradient` repetido, no una imagen: escala sin pesar nada."
      >
        <Sample
          title="Trama de puntos"
          code="ft-halftone · ft-halftone-dense · ft-halftone-light"
          app="ft"
          note="`-light` invierte el punto a blanco, para las bandas de color saturado y la portada oscura. `-mask` (no visible aquí) desvanece la trama por abajo para que una sección se disuelva en el papel en vez de cortarse en seco."
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="ft-halftone border-ft h-24 rounded-ft border-ft-ink bg-ft-paper" />
            <div className="ft-halftone-dense border-ft h-24 rounded-ft border-ft-ink bg-ft-paper" />
            <div className="ft-halftone-light border-ft h-24 rounded-ft border-ft-ink bg-ft-pink" />
          </div>
        </Sample>

        <Sample
          title="Papel y rayas"
          code="ft-newsprint · ft-stripes · shadow-ft-pop"
          app="ft"
          note="La sombra dura (`shadow-ft-pop`, sin blur ni spread) ES el sistema de elevación: una losa de tinta desplazada, como un segundo pase mal registrado en papel barato. No hay ni una sombra suave en toda la app."
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="ft-newsprint border-ft h-24 rounded-ft border-ft-ink bg-white" />
            <div className="ft-stripes border-ft h-24 rounded-ft border-ft-ink" />
            <div className="border-ft flex h-24 items-center justify-center rounded-ft border-ft-ink bg-white shadow-ft-pop">
              <span className="font-ft-ui text-[0.6875rem] font-extrabold uppercase tracking-[0.14em]">
                shadow-ft-pop
              </span>
            </div>
          </div>
        </Sample>
      </Section>
    </>
  )
}
