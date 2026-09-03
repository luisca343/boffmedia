"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Gif, GoldCoin, Mars, Neuter, Rotom, RotomMark, RookerMark, Venus } from "@/lib/smartrotom/customIcons"
import { MONO_LABEL, Sample, Section } from "../showcase-shared"

/**
 * The hand-drawn glyphs — everything in `lib/smartrotom/customIcons/`, the icons
 * lucide doesn't ship. This chapter lives under Sistema because the module is
 * cross-app: each specimen below stages its glyph inside the scope of the app that
 * consumes it.
 */

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[6rem] flex-col items-center gap-2 border border-solid border-sr-line bg-sr-panel-2 px-4 py-4">
      <span className="flex h-12 items-center text-sr-txt">{children}</span>
      <span className={cn(MONO_LABEL, "text-center")}>{label}</span>
    </div>
  )
}

export function SrIconosChapter() {
  return (
    <>
      <Section
        id="sr-iconos-inventario"
        kicker="Iconos"
        title="Inventario"
        lead={
          <>
            Todo lo dibujado a mano vive en <code>lib/smartrotom/customIcons/</code>, un fichero por
            glifo — los iconos que lucide no trae. Los cinco primeros son <code>LucideIcon</code> reales
            (<code>createLucideIcon</code>), así que los mapas de iconos de cada app los registran
            como cualquier import de lucide; <code>GoldCoin</code>, <code>RookerMark</code> y{" "}
            <code>RotomMark</code> tienen dirección de arte propia y son componentes.
          </>
        }
      >
        <Sample title="El módulo completo" code='import { … } from "@/lib/smartrotom/customIcons"'>
          <div className="flex flex-wrap gap-3">
            <Cell label="Rotom">
              <Rotom size={30} strokeWidth={1.8} />
            </Cell>
            <Cell label="RotomMark">
              <RotomMark size={34} />
            </Cell>
            <Cell label="RotomMark outline">
              <RotomMark size={34} filled={false} />
            </Cell>
            <Cell label="RookerMark">
              <RookerMark size={34} />
            </Cell>
            <Cell label="RookerMark outline">
              <RookerMark size={34} filled={false} />
            </Cell>
            <Cell label="Mars ♂">
              <Mars size={28} strokeWidth={2} />
            </Cell>
            <Cell label="Venus ♀">
              <Venus size={28} strokeWidth={2} />
            </Cell>
            <Cell label="Neuter ⚲">
              <Neuter size={28} strokeWidth={2} />
            </Cell>
            <Cell label="Gif">
              <Gif size={30} strokeWidth={1.9} />
            </Cell>
            <Cell label="GoldCoin">
              <GoldCoin size={30} />
            </Cell>
          </div>
        </Sample>
      </Section>

      <Section
        id="sr-iconos-rotom"
        kicker="Iconos"
        title="Rotom"
        lead={
          <>
            La mascota — cabeza de plasma con la chispa alta, brazos de rayo caídos, cola en punta
            y sonrisa. Un solo glifo compartido por los mapas de <strong>pasaporte</strong> y{" "}
            <strong>media</strong>; sustituyó al <code>Ghost</code> de lucide.
          </>
        }
      >
        <Sample
          title="En el pasaporte"
          code='<Icon name="rotom" /> · 16px · stroke 2'
          app="ps"
          note={
            <>
              Pasaporte lo pinta como todo su set: trazo 2, tamaño por clase (<code>h-4 w-4</code>),
              tinta <code>currentColor</code> sobre el escritorio o la página.
            </>
          }
        >
          <div className="flex items-center gap-5">
            <Rotom size={16} strokeWidth={2} />
            <Rotom size={24} strokeWidth={2} />
            <Rotom size={40} strokeWidth={2} />
          </div>
        </Sample>

        <Sample title="En media (Mewtube / Mewtwitch)" code="I.rotom · 20px · stroke 1.5" app="mw">
          <div className="flex items-center gap-5">
            <Rotom size={20} strokeWidth={1.5} />
            <Rotom size={32} strokeWidth={1.5} />
            <Rotom size={48} strokeWidth={1.5} />
          </div>
        </Sample>

        <Sample
          title="La marca — el SmartRotom"
          code="<RotomMark size filled />"
          note={
            <>
              El SmartRotom: Rotom poseyendo el teléfono — la pestaña de plasma arriba, la cola de
              enchufe abajo, flotando con su inclinación. El mismo contrato que{" "}
              <code>RookerMark</code>: silueta maciza por defecto con la cara recortada, contorno al
              mismo peso de tinta. Los mapas de iconos siguen usando el <code>Rotom</code> pequeño.
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-6">
            <RotomMark size={48} />
            <RotomMark size={32} />
            <RotomMark size={20} />
            <RotomMark size={48} filled={false} />
            <RotomMark size={32} filled={false} />
          </div>
        </Sample>
      </Section>

      <Section
        id="sr-iconos-rookidee"
        kicker="Iconos"
        title="Rookidee"
        lead={
          <>
            La marca de Rooker es un Rookidee. <code>filled</code> (por defecto) es la silueta maciza
            de marca; el contorno iguala el peso de tinta del resto del set <code>rk-*</code>.
            Sustituyó al pájaro de <code>Twitter</code> de lucide.
          </>
        }
      >
        <Sample title="Silueta y contorno" code="<RookerMark size filled />" app="rk">
          <div className="flex flex-wrap items-center gap-6">
            <RookerMark size={48} />
            <RookerMark size={32} />
            <RookerMark size={20} />
            <RookerMark size={48} filled={false} />
            <RookerMark size={32} filled={false} />
          </div>
        </Sample>

        <Sample
          title="Tinta del acento"
          code='className="text-rk-accent"'
          app="rk"
          theme="light"
          note={
            <>
              <code>currentColor</code> de punta a punta: en la cabecera va en acento, en el toast en
              la tinta del acento — el mismo componente, cero variantes de color.
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-6 text-rk-accent">
            <RookerMark size={40} />
            <RookerMark size={40} filled={false} />
          </div>
        </Sample>
      </Section>

      <Section
        id="sr-iconos-genero"
        kicker="Iconos"
        title="Género"
        lead={
          <>
            Los símbolos Pokémon ♂/♀/⚲ — lucide 0.452 no trae ningún glifo de género. Los consumen
            los mapas de <strong>pc</strong> y <strong>wigglypop</strong> y{" "}
            <code>pokemonDisplayUtils</code> (dimensionados en <code>1em</code> para heredar el
            tamaño del texto).
          </>
        }
      >
        <Sample title="En el PC" code='<Icon name="mars" | "venus" | "neuter" />' app="pc">
          <div className="flex items-center gap-5">
            <Mars size={18} strokeWidth={2} />
            <Venus size={18} strokeWidth={2} />
            <Neuter size={18} strokeWidth={2} />
            <Mars size={30} strokeWidth={2} />
            <Venus size={30} strokeWidth={2} />
            <Neuter size={30} strokeWidth={2} />
          </div>
        </Sample>

        <Sample title="En Wigglypop" code='<Icon name="mars" | "venus" />' app="wp">
          <div className="flex items-center gap-5">
            <Mars size={18} strokeWidth={2} />
            <Venus size={18} strokeWidth={2} />
            <Mars size={30} strokeWidth={2} />
            <Venus size={30} strokeWidth={2} />
          </div>
        </Sample>
      </Section>

      <Section
        id="sr-iconos-economia"
        kicker="Iconos"
        title="Moneda y GIF"
        lead={
          <>
            La moneda del arcade es el único glifo con paleta propia — un degradado radial dorado
            con estrella que se mantiene oro sobre cualquier superficie en lugar de heredar{" "}
            <code>currentColor</code>. El <code>gif</code> es la insignia del redactor de Rooker,
            por fin distinta de <code>image</code>.
          </>
        }
      >
        <Sample
          title="GoldCoin sobre el CRT"
          code="<Icon.Coin s={18} />"
          app="ar"
          note={
            <>
              El id del degradado es una cadena fija a propósito: cada instancia define un degradado
              idéntico, así que los ids duplicados resuelven a la misma pintura.
            </>
          }
        >
          <div className="flex items-center gap-5">
            <GoldCoin size={14} />
            <GoldCoin size={18} />
            <GoldCoin size={28} />
            <GoldCoin size={44} />
            <span className="inline-flex items-center gap-2 font-mono text-[0.9375rem] font-bold">
              <GoldCoin size={18} /> ×2 450
            </span>
          </div>
        </Sample>

        <Sample title="Gif en el redactor" code='<Icon name="gif" />' app="rk">
          <div className="flex items-center gap-5">
            <Gif size={16} strokeWidth={1.9} />
            <Gif size={20} strokeWidth={1.9} />
            <Gif size={28} strokeWidth={1.9} />
          </div>
        </Sample>
      </Section>
    </>
  )
}
