"use client"

import * as React from "react"
import { BookOpenIcon, MapIcon } from "lucide-react"
import { Sample, Section } from "../showcase-shared"
import { PokeballIcon, StatusPill, TypeChip, TypeGlyph } from "../../../pokedex/_components/ui"
import { MetaStat, PageHead } from "../../../pokedex/_components/PageHead"
import { SecondaryPageHeader } from "../../../pokedex/_components/SecondaryPageHeader"
import { ALL_TYPES, TYPE_COLORS, TYPE_LABELS } from "../../../pokedex/_utils/typeColors"
import { STATUS_META, type DexStatus } from "../../../pokedex/_utils/dexMeta"

const STATUSES = Object.keys(STATUS_META) as DexStatus[]
const CATEGORIES = ["physical", "special", "status"]

export function PkPrimitivasChapter() {
  return (
    <>
      <Section
        id="pk-tipos"
        kicker="Pokédex"
        title="Tipos"
        lead="Los dieciocho tipos son la señalética de la Pokédex: el mismo chip en la ficha, en la tabla de movimientos y en la lista de apariciones. Color de fondo, tinta contrastada y un glifo trazado a mano — nada de imágenes."
      >
        <Sample
          title="Los 18 tipos"
          code="<TypeChip type>"
          app="pk"
          note="El color de cada tipo es un DATO (`_utils/typeColors.ts` → `TYPE_COLORS`), aplicado con `style` en línea. Nunca una clase construida a partir del tipo: una clase concatenada en tiempo de ejecución no existe, porque el JIT de Tailwind no puede verla — es el fallo que se corrigió en la migración, y `pnpm check:v3` lo bloquea."
        >
          {ALL_TYPES.map((t) => (
            <TypeChip key={t} type={t} />
          ))}
        </Sample>

        <Sample
          title="Tamaños y piezas"
          code='size="sm" | "md" | "lg" · showGlyph · showLabel'
          app="pk"
          col
        >
          <div className="flex flex-wrap items-center gap-3">
            <TypeChip type="fire" size="sm" />
            <TypeChip type="fire" size="md" />
            <TypeChip type="fire" size="lg" />
            <span className="mx-1 h-6 w-px bg-white/10" />
            <TypeChip type="water" showLabel={false} />
            <TypeChip type="water" showGlyph={false} />
            <span className="mx-1 h-6 w-px bg-white/10" />
            <span className="text-pk-secondary-400">
              <TypeGlyph type="water" size={20} />
            </span>
            <span className="text-pk-highlight-400">
              <TypeGlyph type="grass" size={20} />
            </span>
            <span className="text-pk-accent-400">
              <TypeGlyph type="psychic" size={20} />
            </span>
          </div>
          <p className="w-full text-[13px] leading-[1.6] text-pk-surface-400">
            <b className="font-semibold text-pk-surface-100">TypeGlyph</b> se puede usar suelto: hereda{" "}
            <code className="font-pk-mono text-[12px] text-pk-primary-300">currentColor</code>, así que sirve de icono
            dentro de cualquier tinta.
          </p>
        </Sample>

        <Sample
          title="Categorías de daño"
          code='type="physical" | "special" | "status"'
          app="pk"
          note="Las tres categorías de movimiento reutilizan el mismo chip para que las tablas no cambien de gramática a mitad de fila."
        >
          {CATEGORIES.map((c) => (
            <TypeChip key={c} type={c} />
          ))}
        </Sample>

        <Sample
          title="La fuente de verdad"
          code="TYPE_COLORS"
          app="pk"
          note="El mismo mapa alimenta chips, degradados de cabecera, barras y aristas del grafo de debilidades. Si un color de tipo cambia, cambia aquí y en ningún sitio más."
        >
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {ALL_TYPES.map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
              >
                <i className="h-4 w-4 flex-none rounded-sm" style={{ background: TYPE_COLORS[t] }} />
                <span className="min-w-0 flex-1 truncate text-[12px] text-pk-surface-300">{TYPE_LABELS[t]}</span>
                <code className="font-pk-mono text-[10px] uppercase text-pk-surface-500">{TYPE_COLORS[t]}</code>
              </div>
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="pk-estado"
        kicker="Pokédex"
        title="Estado y pokéball"
        lead="`StatusPill` dice en qué punto de la captura está una entrada; `PokeballIcon` es la marca de la app, un SVG de un solo trazo que hereda el color del contexto."
      >
        <Sample
          title="Estado de la entrada"
          code="<StatusPill status>"
          app="pk"
          note="Los cuatro estados salen de `STATUS_META` (`_utils/dexMeta.ts`): tinta, fondo al 15 % y etiqueta en es-ES. El punto lleva un halo del mismo color. `status` desconocido cae a «Desconocido» en vez de romperse."
        >
          {STATUSES.map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          <span className="mx-1 h-6 w-px bg-white/10" />
          <StatusPill status="caught" size="sm" />
          <StatusPill status="caught" size="md" />
          <StatusPill status="caught" size="lg" />
          <StatusPill status="shiny" showLabel={false} />
        </Sample>

        <Sample title="Pokéball" code="<PokeballIcon size color>" app="pk">
          <span className="text-pk-surface-400">
            <PokeballIcon size={16} />
          </span>
          <span className="text-pk-surface-100">
            <PokeballIcon size={24} />
          </span>
          <PokeballIcon size={32} color="#f97316" />
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-pk-primary-400 to-pk-primary-700 shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
            <PokeballIcon size={20} color="white" />
          </div>
        </Sample>
      </Section>

      <Section
        id="pk-cabeceras"
        kicker="Pokédex"
        title="Cabeceras"
        lead="Toda pantalla secundaria abre igual: etiqueta mono con icono, titular Orbitron, una línea de descripción y, a la derecha, las cifras que resumen lo que hay debajo."
      >
        <Sample
          title="Cabecera de pantalla"
          code="<PageHead> · <MetaStat>"
          app="pk"
          note="`icon` es un componente (los de Heroicons entran tal cual: reciben `className`). `meta` es libre — se suele llenar con uno o dos `MetaStat`, que ponen la cifra en Orbitron tabular."
        >
          <div className="w-full">
            <PageHead
              icon={MapIcon}
              eyebrow="Base de datos"
              title="Apariciones"
              desc="Dónde y cuándo aparece cada especie: bioma, franja horaria y rareza."
              meta={
                <>
                  <MetaStat label="Especies" value={905} />
                  <MetaStat label="Biomas" value={48} />
                </>
              }
            />
          </div>
        </Sample>

        <Sample
          title="Cabecera con contador"
          code='meta={<MetaStat label="Entradas" …>}'
          app="pk"
        >
          <div className="w-full">
            <PageHead
              icon={BookOpenIcon}
              eyebrow="Referencia"
              title="Movimientos"
              desc="Potencia, precisión, tipo y efecto de cada movimiento del juego."
              meta={<MetaStat label="Total" value={924} />}
            />
          </div>
        </Sample>

        <Sample
          title="Envoltorio de pantalla secundaria"
          code="<SecondaryPageHeader>"
          app="pk"
          padded={false}
          note="No es una primitiva sino el marco completo: monta `HubSidebar` (la navegación real, con enlaces que salen de la guía de estilos) y una zona principal que hace scroll por dentro. Espera altura completa, así que aquí se le da un contenedor de 460px; la barra sólo aparece a partir de `lg`. `ScreenShell` es su hermano sin cabecera."
        >
          <div className="h-[460px] w-full overflow-hidden">
            <SecondaryPageHeader
              eyebrow="Base de datos"
              title="Biomas"
              description="Los 48 biomas del servidor y las especies que los habitan."
              count={48}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {["Bosque", "Cueva", "Playa"].map((b) => (
                  <div key={b} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
                    <b className="font-pk-display text-sm font-bold text-pk-surface-50">{b}</b>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <TypeChip type="grass" size="sm" />
                      <TypeChip type="bug" size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </SecondaryPageHeader>
          </div>
        </Sample>
      </Section>
    </>
  )
}
