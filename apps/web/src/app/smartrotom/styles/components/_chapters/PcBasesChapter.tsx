"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { BOX_THEMES, THEME_ACCENT, THEME_LABEL_KEY, WALLPAPER_CLASS } from "@/app/smartrotom/pc/_utils/boxThemes"
import { MONO_LABEL, Sample, Section, Swatches } from "../showcase-shared"

const STRUCTURE = [
  ["bg-pc-bg", "bg · el vacío"],
  ["bg-pc-bg-1", "bg-1"],
  ["bg-pc-bg-2", "bg-2"],
  ["bg-pc-fg", "fg · texto"],
  ["bg-pc-fg-muted", "fg-muted · cuerpo"],
  ["bg-pc-fg-subtle", "fg-subtle · dato"],
] as const

const ROLES = [
  ["bg-pc-accent", "accent · estructura"],
  ["bg-pc-accent-strong", "accent-strong"],
  ["bg-pc-cyan", "cyan · selección"],
  ["bg-pc-violet", "violet · comparar"],
  ["bg-pc-green", "green · soltar aquí"],
  ["bg-pc-amber", "amber · objeto"],
  ["bg-pc-rose", "rose · destructivo"],
  ["bg-pc-gold", "gold · shiny"],
] as const

export function PcBasesChapter() {
  const tr = useTranslations("pc")
  return (
    <>
      <Section
        id="pc-color"
        kicker="PC"
        title="Color"
        lead="Un vacío de pizarra sobre el que flotan paneles de cristal esmerilado. Oscuro y solo oscuro: la consola tiene una cara y no consulta el selector de temas de la plataforma. Hay un único acento estructural —el azul— y seis colores que no decoran nada: cada uno significa exactamente una cosa."
      >
        <Sample
          title="Estructura y tinta"
          code="pc-bg · pc-bg-1 · pc-bg-2 · pc-fg*"
          app="pc"
          canvas={false}
          note="Los paneles no usan estos tokens directamente: son cristales semitransparentes (`pc-glass`) con desenfoque de fondo, para que el fondo de la caja se transparente a través del cromo que tiene encima."
        >
          <Swatches tokens={STRUCTURE} />
        </Sample>

        <Sample
          title="Roles"
          code="pc-accent · pc-cyan · pc-violet · pc-green · pc-amber · pc-rose · pc-gold"
          app="pc"
          canvas={false}
          note="Esta es la regla que mantiene legible una rejilla de 900 Pokémon: el color nunca es decorativo. Cian = selección múltiple. Violeta = comparación y filtros. Verde = un destino válido para soltar. Ámbar = lleva objeto. Rosa = destructivo o debilitado. Oro = shiny. Si un color aparece, significa su rol."
        >
          <Swatches tokens={ROLES} />
        </Sample>
      </Section>

      <Section
        id="pc-tipografia"
        kicker="PC"
        title="Tipografía"
        lead="Tres familias con tres trabajos que no se solapan."
      >
        <Sample
          title="Las tres familias"
          code="font-pc · font-pc-display · font-pc-mono"
          app="pc"
          note="Chakra Petch (display) es la cara HUD: escuadrada, técnica, y solo aparece en el logotipo, los nombres de caja y los títulos de panel. Nunca en texto corrido —sus contraformas se cierran por debajo de ~13px—. JetBrains Mono lleva TODAS las cifras: número de Pokédex, nivel, contadores de caja, IV/EV, totales. La app entera es una rejilla de números que tiene que alinear en columna, y esa es la única razón por la que hay una mono."
        >
          <div className="flex flex-col gap-4">
            <div>
              <div className={MONO_LABEL}>font-pc-display · Chakra Petch</div>
              <div className="font-pc-display text-2xl font-bold tracking-[.02em] text-pc-fg">
                SmartRotom <span className="text-pc-accent">PC</span>
              </div>
            </div>
            <div>
              <div className={MONO_LABEL}>font-pc · Inter</div>
              <p className="max-w-prose text-[0.84375rem] leading-relaxed text-pc-fg-muted">
                Arrastra un Pokémon a otro hueco para intercambiarlo. Suelta sobre una caja del
                lateral para moverlo allí sin abrirla.
              </p>
            </div>
            <div>
              <div className={MONO_LABEL}>font-pc-mono · JetBrains Mono</div>
              <div className="flex gap-5 font-pc-mono text-[0.8125rem] text-pc-fg">
                <span>#025</span>
                <span>Nv 100</span>
                <span>27/30</span>
                <span className="text-pc-green">IV 94%</span>
              </div>
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="pc-fondos"
        kicker="PC"
        title="Fondos de caja"
        lead="Diez fondos con nombre. Son la única fuente de color propio de la app —el resto del cromo es pizarra— y son lo que hace que una caja se reconozca de un vistazo antes de leer su nombre."
      >
        <Sample
          title="Los diez fondos"
          code="pc-wp + WALLPAPER_CLASS[theme] + pc-wp-dots"
          app="pc"
          canvas={false}
          note="El tema de una caja es un DATO (sale de lo que el usuario guardó), así que la clase NUNCA se puede interpolar: `pc-wp-${theme}` compila a nada y la caja se queda desnuda, en silencio. Por eso existe el mapa de clases literales `WALLPAPER_CLASS` en `_utils/boxThemes.ts`. Es la trampa más cara del sistema (gap G2 de la auditoría) porque falla sin avisar."
        >
          <div className="grid grid-cols-5 gap-2.5">
            {BOX_THEMES.map((t) => (
              <div
                key={t}
                className="relative h-16 overflow-hidden rounded-pc border border-pc-line"
              >
                <span className={`pc-wp pc-wp-dots ${WALLPAPER_CLASS[t]}`} />
                <span
                  className="absolute left-1.5 top-1.5 h-2 w-2 rounded-pc-pill"
                  style={{ background: THEME_ACCENT[t] }}
                />
                <span className="absolute inset-x-0 bottom-1 text-center text-[0.625rem] font-semibold text-pc-fg [text-shadow:0_1px_3px_#000]">
                  {tr(THEME_LABEL_KEY[t])}
                </span>
              </div>
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
