"use client"

import * as React from "react"
import {
  ActionBtn,
  PokeBall,
  ReactionControl,
  ReactionGlyph,
  ReactionSummary,
  RichText,
  StatPill,
} from "@/app/smartrotom/rooker/_components/ui"
import { REACTIONS, applyReaction, type ReactionType } from "@/app/smartrotom/rooker/_utils/reactions"
import { Sample, Section } from "../showcase-shared"
import { RK_DEMO_REACTIONS } from "./rk-demo"

const REACTION_LABEL: Record<ReactionType, string> = {
  heart: "Me gusta",
  pokeball: "¡Captura!",
  choque: "Choque",
  shiny: "Shiny",
  fuego: "Fueguito",
}

/**
 * The pieces that make Rooker a *nest* rather than a Twitter clone: the five reactions,
 * the action bar they live in, and the derived trainer numbers.
 */
export function RkNidoChapter() {
  const [state, setState] = React.useState<{ counts: typeof RK_DEMO_REACTIONS; mine: ReactionType | null }>({
    counts: RK_DEMO_REACTIONS,
    mine: "shiny",
  })

  return (
    <>
      <Section
        id="rk-reacciones"
        kicker="Rooker · Nido"
        title="Reacciones"
        lead={
          <>
            La regla de diseño: <strong>un toque simple siempre funciona</strong>. Pulsar el botón
            reacciona con ❤ (o retira la que ya dejaste), exactamente como un me gusta de siempre —
            el caso común es un toque y nada nuevo que aprender. Al pasar el ratón se abre la
            bandeja, y ahí viven las cuatro reacciones Pixelmon. Quien ponga{" "}
            <em>Reacciones → Solo me gusta</em> en Pantalla no ve la bandeja jamás.
          </>
        }
      >
        <Sample
          title="El control"
          code="<ReactionControl reactions mine onReact />"
          app="rk"
          note="La bandeja tiene que sobrevivir al hueco entre el botón y ella misma, así que el cierre va en un temporizador que reentrar cancela: sin eso se cierra de golpe mientras el puntero recorre los 6px que la separan."
        >
          <ReactionControl
            reactions={state.counts}
            mine={state.mine}
            onReact={(type) =>
              setState((s) => {
                const next = applyReaction(s.counts, s.mine, type)
                return { counts: next.counts, mine: next.mine }
              })
            }
          />
        </Sample>

        <Sample title="Los cinco glifos" code="<ReactionGlyph type active />" app="rk">
          <div className="flex flex-wrap items-center gap-6">
            {REACTIONS.map((r) => (
              <div key={r.type} className="flex flex-col items-center gap-1.5">
                <ReactionGlyph type={r.type} size={28} active />
                <span className="text-[0.6875rem] text-rk-fg-subtle">{REACTION_LABEL[r.type]}</span>
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="Resumen"
          code="<ReactionSummary reactions />"
          app="rk"
          note="Sólo se dibujan las cuatro más pesadas: a partir de ahí los discos se solapan en un borrón y dejan de llevar información. Las que nadie dejó se omiten enteras."
        >
          <ReactionSummary reactions={RK_DEMO_REACTIONS} />
        </Sample>

        <Sample
          title="Poké Ball"
          code='<PokeBall variant="ball-ultra" />'
          app="rk"
          note="Los cinco estilos de ball son un conjunto de color guiado por datos, así que viven en un mapa JS aplicado por atributos fill — un fragmento fill-${variant} jamás compilaría (§4)."
        >
          <div className="flex flex-wrap items-center gap-4">
            <PokeBall size={32} variant="ball-poke" />
            <PokeBall size={32} variant="ball-great" />
            <PokeBall size={32} variant="ball-ultra" />
            <PokeBall size={32} variant="ball-luxury" />
            <PokeBall size={32} variant="ball-quick" />
          </div>
        </Sample>
      </Section>

      <Section
        id="rk-acciones"
        kicker="Rooker · Nido"
        title="Barra de acciones"
        lead={
          <>
            El glifo vive en un disco de 30px que permanece invisible hasta el hover, cuando se lava
            con el color <em>de la propia acción</em> — azul para responder, verde para retrinar. El
            color es una propiedad de la acción, no del tema.
          </>
        }
      >
        <Sample title="ActionBtn" code='<ActionBtn icon="reply" tone="accent" count />' app="rk">
          <div className="flex max-w-[27.5rem] items-center justify-between">
            <ActionBtn icon="reply" label="Responder" count={318} tone="accent" />
            <ActionBtn icon="retrino" label="Retrinar" count={1240} tone="rt" active fillActive={false} />
            <ActionBtn icon="bookmark" label="Guardar" tone="accent" />
          </div>
        </Sample>

        <Sample
          title="RichText"
          code="<RichText text />"
          app="rk"
          note="El patrón de etiqueta acepta acentos y ñ: #PokédexViva es una etiqueta que la gente usa de verdad, y \\w a secas la cortaría en la é."
        >
          <RichText text={"¡Por fin! Gengar shiny tras 4.200 encuentros ✨\n\nGracias @notch por el aguante. #ShinyCheck #PokédexViva"} />
        </Sample>
      </Section>

      <Section
        id="rk-datos"
        kicker="Rooker · Nido"
        title="Datos del entrenador"
        lead={
          <>
            Las cuatro cifras del perfil son <strong>derivadas y no se pueden posar</strong>: capturas
            y shinies salen del registro de la Pokédex, combates del registro de repeticiones, y el
            porcentaje de la propia Pokédex. Es el trato que hace el diseño — el adorno es tuyo, los
            números son del servidor.
          </>
        }
      >
        <Sample
          title="StatPill"
          code="<StatPill value label icon tone />"
          app="rk"
          note="Tabular-nums, sin excepción: cuatro fichas juntas tienen que cuadrar en sus dígitos o la fila se lee mellada."
        >
          <div className="flex w-full gap-2">
            <StatPill value="1.284" label="CAPTURAS" icon="plus" tone="accent" />
            <StatPill value="412" label="COMBATES" icon="sword" tone="fuego" />
            <StatPill value="9" label="SHINIES" icon="sparkle" tone="shiny" filled />
            <StatPill value="87%" label="POKÉDEX" icon="trophy" tone="choque" filled />
          </div>
        </Sample>
      </Section>
    </>
  )
}
