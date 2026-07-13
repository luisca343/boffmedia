"use client"

import * as React from "react"
import { Icon, Sprite, TypeBadge } from "@/app/smartrotom/pc/_components/ui"
import { WALLPAPER_CLASS } from "@/app/smartrotom/pc/_utils/boxThemes"
import { ALL_TYPES } from "@/app/smartrotom/pc/_utils/constants"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { MONO_LABEL, Sample, Section } from "../showcase-shared"

// Real dex numbers: the sprites below resolve through the same manifest the app uses,
// so a specimen that renders here is one that renders in the PC.
const DEMO = [25, 6, 9, 3, 448, 149, 130, 94, 143, 65, 212, 359]

/** The showcase does not mount the PC's layout, which is what normally fetches this. */
function useSprites() {
  const manifest = useSpriteManifestStore((s) => s.manifest)
  const fetchManifest = useSpriteManifestStore((s) => s.fetchManifest)
  React.useEffect(() => {
    if (!manifest) void fetchManifest()
  }, [manifest, fetchManifest])
}

function Slot({ dex, state, children }: { dex?: number; state?: string; children?: React.ReactNode }) {
  return (
    <div className={["pc-slot", state].filter(Boolean).join(" ")}>
      {dex && <Sprite dex={dex} className="absolute inset-[7%] h-[86%] w-[86%]" />}
      {children}
    </div>
  )
}

export function PcAlmacenChapter() {
  useSprites()

  return (
    <>
      <Section
        id="pc-huecos"
        kicker="PC"
        title="Huecos"
        lead="El hueco es la pieza que más se repite en toda la app —hasta 900 a la vez— y la única cuyos estados se combinan entre sí: un favorito puede estar además seleccionado y ser el destino de un arrastre. Por eso los estados son clases aditivas, no un enum."
      >
        <Sample
          title="Estados"
          code="pc-slot + pc-slot-empty | -selected | -multi | -compare | -drop | -fav | -dragging"
          app="pc"
          note="Cada estado toma prestado su color del rol que le toca: azul = este es el que estás mirando, cian = está en la selección múltiple, violeta = está en la comparación, verde = suéltalo aquí, oro = favorito. El verde es el más importante de acertar: es el único feedback de que un arrastre va a funcionar."
        >
          <div className="grid w-full max-w-2xl grid-cols-4 gap-3 sm:grid-cols-7">
            {[
              [DEMO[0], "", "normal"],
              [undefined, "pc-slot-empty", "vacío"],
              [DEMO[1], "pc-slot-selected", "abierto"],
              [DEMO[2], "pc-slot-multi", "selección"],
              [DEMO[3], "pc-slot-compare", "comparar"],
              [DEMO[4], "pc-slot-drop", "soltar"],
              [DEMO[5], "pc-slot-fav", "favorito"],
            ].map(([dex, state, label]) => (
              <div key={label as string} className="flex flex-col items-center gap-2">
                <Slot dex={dex as number | undefined} state={state as string} />
                <span className={MONO_LABEL}>{label as string}</span>
              </div>
            ))}
          </div>
        </Sample>

        <Sample
          title="Indicadores"
          code="4 esquinas · shiny, género, objeto, favorito"
          app="pc"
          note="Las cuatro esquinas del hueco son cuatro datos, y ninguno se codifica solo por color: el shiny lleva su destello, el objeto su punto ámbar, el favorito su corazón. Todo lo que se ve aquí sale del payload real del servidor de juego —no hay ni bola, ni entrenador original, ni fecha de captura, porque el juego no los manda—."
        >
          <div className="w-24">
            <Slot dex={DEMO[6]} state="pc-slot-fav">
              <span className="absolute left-[3px] top-[3px]">
                <Icon name="sparkles" size={13} fill="rgb(var(--pc-gold))" className="text-pc-gold" />
              </span>
              <span className="absolute right-[3px] top-[3px]">
                <Icon name="venus" size={13} className="text-[#ff7eb6]" />
              </span>
              <span className="absolute bottom-[3px] left-[3px] h-[7px] w-[7px] rounded-pc-pill bg-pc-amber shadow-[0_0_0_2px_rgb(7_11_22_/_.6)]" />
              <span className="absolute bottom-[3px] right-[3px]">
                <Icon name="heart" size={12} fill="rgb(var(--pc-rose))" className="text-pc-rose" />
              </span>
            </Slot>
          </div>
        </Sample>
      </Section>

      <Section
        id="pc-caja"
        kicker="PC"
        title="La caja"
        lead="Seis por cinco, treinta huecos, sobre un fondo con nombre. La rejilla de resultados de un filtro se rellena hasta esos mismos treinta huecos aunque sobren: así el escenario no cambia de tamaño al filtrar, y nada salta."
      >
        <Sample
          title="Rejilla 6×5 sobre fondo"
          code="pc-glass + pc-wp + WALLPAPER_CLASS[theme] + pc-wp-dots"
          app="pc"
          canvas={false}
        >
          <div className="pc-glass relative w-full max-w-lg overflow-hidden rounded-pc-lg">
            <span className={`pc-wp pc-wp-dots ${WALLPAPER_CLASS.ocean}`} />
            <div className="relative p-4">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="box" size={16} className="text-pc-accent" />
                <span className="font-pc-display text-[15px] font-bold">Océano</span>
                <span className="ml-auto font-pc-mono text-[11.5px] text-pc-fg-subtle">12/30</span>
              </div>
              <div className="grid grid-cols-6 gap-[clamp(6px,0.7vw,11px)]">
                {Array.from({ length: 30 }, (_, i) => {
                  const dex = i < DEMO.length ? DEMO[i] : undefined
                  return <Slot key={i} dex={dex} state={dex ? "" : "pc-slot-empty"} />
                })}
              </div>
            </div>
          </div>
        </Sample>
      </Section>

      <Section
        id="pc-tipos"
        kicker="PC"
        title="Tipos"
        lead="Dieciocho colores que no son tokens. Son datos: viven en un mapa de JS y se aplican con `style` en línea, porque una clase de fondo interpolada con el tipo no llegaría nunca a compilarse."
      >
        <Sample
          title="TypeBadge"
          code="<TypeBadge type={t} size='sm' | 'md' />"
          app="pc"
          canvas={false}
          note="Los tipos de un Pokémon del PC casi nunca vienen en el payload: el equipo activo los trae, el almacén no. Se derivan de la forma de la especie en el store de la Pokédex (`typesOf`) —dato real, solo que traído de otro sitio—."
        >
          <div className="flex flex-wrap gap-1.5">
            {ALL_TYPES.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
        </Sample>
      </Section>
    </>
  )
}
