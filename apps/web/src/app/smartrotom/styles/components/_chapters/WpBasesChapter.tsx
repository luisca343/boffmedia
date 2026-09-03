"use client"

import { Sample, Section, Swatches } from "../showcase-shared"

/**
 * Wigglypop's foundations — `wp-*`, the marketplace's design system.
 *
 * The chapter leads with the two-accent rule because it is the single thing that
 * makes the system legible: pink is identity and action, teal is money and trust.
 */
export function WpBasesChapter() {
  return (
    <>
      <Section
        id="wp-color"
        kicker="Wigglypop"
        title="Color"
        lead="Dos acentos, y el reparto ES el sistema. El rosa globo (identidad y acción) manda en la marca, el botón primario y la pestaña activa. El verde azulado — el guiño a Wallapop — está reservado al DINERO y a la confianza: todo precio, la tasación y los sellos de depósito. Nunca es decorativo. Que el dinero sea teal es lo que impide que una parrilla de sesenta precios rosas se convierta en ruido."
      >
        <Sample title="Superficies" code="bg-wp-*" app="wp" canvas={false}>
          <Swatches
            tokens={[
              ["bg-wp-bg", "Página (rosa crema)"],
              ["bg-wp-bg-soft", "Página, arriba"],
              ["bg-wp-panel", "Tarjeta (blanco)"],
              ["bg-wp-panel-2", "Hundido"],
              ["bg-wp-cream", "Monedero"],
              ["bg-wp-cream-deep", "Borde monedero"],
            ]}
          />
        </Sample>

        <Sample
          title="Acento · identidad y acción"
          code="wp-accent"
          app="wp"
          canvas={false}
          note="`accent-light` y `accent-strong` son las dos paradas del degradado primario (`.wp-grad-primary`), que comparten el botón primario, la pestaña activa y la marca — si divergen, el cromo deja de leerse como un solo objeto."
        >
          <Swatches
            tokens={[
              ["bg-wp-accent", "Acento"],
              ["bg-wp-accent-strong", "Acento fuerte"],
              ["bg-wp-accent-light", "Acento claro"],
            ]}
          />
        </Sample>

        <Sample
          title="Dinero y confianza"
          code="wp-teal · wp-green"
          app="wp"
          canvas={false}
          note="`teal-deep` existe porque el teal plano sobre el chip de confianza (fondo teal claro) no pasa AA — es el color del TEXTO sobre teal, no otro acento."
        >
          <Swatches
            tokens={[
              ["bg-wp-teal", "Precio"],
              ["bg-wp-teal-deep", "Texto sobre teal"],
              ["bg-wp-green", "Liberado / correcto"],
            ]}
          />
        </Sample>

        <Sample
          title="Rareza"
          code="wp-rarity-*"
          app="wp"
          canvas={false}
          note="Data-driven: los IVs del Pokémon eligen el tramo, así que se aplican por mapas de clases LITERALES en `_utils/rarity.ts` — nunca `text-wp-rarity-${r}`, que el JIT jamás compilaría (§4). Fíjate en que «raro» ES el teal y «legendario» ES el oro: los mismos tripletes que el dinero y la recompensa, a propósito, para que la paleta siga siendo una y no dos."
        >
          <Swatches
            tokens={[
              ["bg-wp-rarity-comun", "Común"],
              ["bg-wp-rarity-raro", "Raro"],
              ["bg-wp-rarity-epico", "Épico"],
              ["bg-wp-rarity-legendario", "Legendario"],
            ]}
          />
        </Sample>

        <Sample title="Roles y tinta" code="wp-fg · wp-violet · wp-amber · wp-rose" app="wp" canvas={false}>
          <Swatches
            tokens={[
              ["bg-wp-fg", "Tinta (ciruela)"],
              ["bg-wp-fg-muted", "Tinta apagada"],
              ["bg-wp-fg-subtle", "Tinta sutil"],
              ["bg-wp-violet", "Ofertas"],
              ["bg-wp-amber", "Atención"],
              ["bg-wp-gold", "Seguimiento"],
              ["bg-wp-rose", "Error / urgente"],
            ]}
          />
        </Sample>
      </Section>

      <Section
        id="wp-tipografia"
        kicker="Wigglypop"
        title="Tipografía"
        lead="Sólo dos familias, y el reparto es peculiar. Fredoka es la cara REDONDA (marca, títulos de tarjeta y panel, todo encabezado) y se agota en 600 — pedirle 700 la deja igual, así que el «negrita» del sistema ES el 600. Nunito lleva el cuerpo Y todas las cifras: `font-wp-mono` no es una monoespaciada, es Nunito 800 con cifras tabulares."
      >
        <Sample title="Fredoka · display" code="font-wp-display" app="wp">
          <div className="flex flex-col gap-2">
            <span className="font-wp-display text-[1.75rem] font-semibold text-wp-fg">
              Wigglypop — Mercado Rotom
            </span>
            <span className="font-wp-display text-[1.3125rem] font-semibold text-wp-fg">
              Cabecera de página · 21px/600
            </span>
            <span className="font-wp-display text-base font-semibold text-wp-fg">
              Título de tarjeta · 16px/600
            </span>
          </div>
        </Sample>

        <Sample
          title="Nunito · cuerpo"
          code="font-wp"
          app="wp"
          note="El peso de REPOSO de la app es 600, no 400: Nunito en regular se ve anémica sobre esta página, así que `.wp-app` la fija en semibold y sube desde ahí."
        >
          <div className="flex flex-col gap-2">
            <span className="font-wp text-sm font-semibold text-wp-fg">Cuerpo · 600 (reposo)</span>
            <span className="font-wp text-sm font-bold text-wp-fg">Énfasis · 700</span>
            <span className="font-wp text-sm font-extrabold text-wp-fg">Etiqueta / botón · 800</span>
            <span className="font-wp text-[0.6875rem] font-black uppercase tracking-[.1em] text-wp-fg-subtle">
              Kicker · 900 versalitas
            </span>
          </div>
        </Sample>

        <Sample
          title="Cifras · tabulares"
          code=".wp-num"
          app="wp"
          note="No negociable en cualquier cosa numérica: precio, saldo, nivel, IV, recuento. Es lo que alinea una columna de precios; sin ella la tabla de seguimiento baila."
        >
          <div className="flex flex-col gap-1 font-wp">
            <span className="wp-num text-wp-fg">₽184.650</span>
            <span className="wp-num text-wp-fg">₽9.450</span>
            <span className="wp-num text-wp-fg">₽41.200</span>
          </div>
        </Sample>
      </Section>

      <Section
        id="wp-geometria"
        kicker="Wigglypop"
        title="Geometría y elevación"
        lead="Un sistema de globos: radios generosos y — la cifra más determinante de todas — un borde de 1,5px en cada tarjeta, botón, input y hueco. A 1px las tarjetas blancas se disuelven en la página rosa; a 2px se convierten en pegatinas. Y toda sombra va teñida de ciruela: un gris neutro sobre esta página se lee como suciedad."
      >
        <Sample title="Radios" code="rounded-wp-*" app="wp">
          <div className="flex flex-wrap items-end gap-3">
            {[
              ["rounded-wp-sm", "sm · 13px — controles"],
              ["rounded-wp", "wp · 18px — tarjetas"],
              ["rounded-wp-lg", "lg · 26px — modales"],
              ["rounded-wp-pill", "pill — todo lo interactivo redondo"],
            ].map(([cls, label]) => (
              <div key={cls} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-16 border-wp border-wp-line/46 bg-white ${cls}`} />
                <span className="font-wp text-[0.6875rem] font-bold text-wp-fg-muted">{label}</span>
              </div>
            ))}
          </div>
        </Sample>

        <Sample title="Elevación" code="shadow-wp-*" app="wp">
          <div className="flex flex-wrap gap-4">
            {[
              ["shadow-wp-soft", "soft — tarjeta en reposo"],
              ["shadow-wp", "wp — panel"],
              ["shadow-wp-primary", "primary — botón rosa"],
              ["shadow-wp-card-hover", "card-hover"],
              ["shadow-wp-glow", "glow — hueco activo"],
            ].map(([cls, label]) => (
              <div key={cls} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-24 rounded-wp border-wp border-wp-line/24 bg-white ${cls}`} />
                <span className="font-wp text-[0.6875rem] font-bold text-wp-fg-muted">{label}</span>
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="Fondos de sprite"
          code=".wp-wall-*"
          app="wp"
          note="El lavado pastel bajo cada sprite. Lo elige el tipo primario del Pokémon — otro mapa de clases literales (`_utils/spriteTheme.ts`). Shiny se lleva `ocean` y legendario `dusk` a propósito: son los dos lavados más fríos, y es sobre ellos donde el destello teal y el aura dorada rinden a plena fuerza."
        >
          <div className="flex flex-wrap gap-2">
            {[
              "classic", "ocean", "volcano", "meadow",
              "dusk", "space", "cave", "rainbow", "sakura", "forest",
            ].map((w) => (
              <div key={w} className="flex flex-col items-center gap-1.5">
                <div
                  className={`wp-wall wp-wall-${w} wp-dots h-14 w-14 rounded-wp-sm border-wp border-wp-line/24`}
                />
                <span className="font-wp text-[0.625rem] font-bold text-wp-fg-subtle">{w}</span>
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="Movimiento · el rebote"
          code="animate-wp-pop · ease-wp"
          app="wp"
          note="La firma del sistema es el SOBREPASO. `wp-pop` escala más allá de 1 antes de asentarse: ese 8% de más sobre la curva `ease-wp` es lo que hace que una tarjeta se sienta hinchada y no meramente animada. `ease-wp-soft` NO sobrepasa y es la que va en lo que se desvanece o desliza, donde un rebote parecería un fallo."
        >
          <div className="flex gap-3">
            <div className="animate-wp-pop rounded-wp border-wp border-wp-line/46 bg-white px-4 py-3 font-wp text-[0.8125rem] font-extrabold text-wp-fg shadow-wp-soft motion-reduce:animate-none">
              wp-pop
            </div>
            <div className="animate-wp-floaty rounded-wp border-wp border-wp-line/46 bg-white px-4 py-3 font-wp text-[0.8125rem] font-extrabold text-wp-fg shadow-wp-soft motion-reduce:animate-none">
              wp-floaty
            </div>
          </div>
        </Sample>
      </Section>
    </>
  )
}
