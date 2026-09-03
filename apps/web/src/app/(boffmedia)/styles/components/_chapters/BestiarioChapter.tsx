"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { MhElemBadge, MhSpeciesTag, MhStars, MhThreatBadge, MonsterCard, MonsterRow } from "@boffmedia/tools-mhwilds/bestiary/bst-kit"
import {
  MhAilmentTag,
  MhBreakPanel,
  MhDangerCard,
  MhDropChance,
  MhDropTable,
  MhHitzoneScan,
  MhHitzoneTable,
  MhRelGear,
  MhStatBlock,
  MhStatusVulns,
  MhTabs,
  MhTag2,
  MhWeaknessGrid,
  type MhBreak,
  type MhHitzone,
  type MhReward,
} from "@/components/boffmedia/ui/mh-bestiary"
import type { MhMonster } from "@boffmedia/tools-mhwilds/types"

// ── Bestiary detail demo data (mock — hitzones/rewards/breaks/strategy). [deferred]
const RATH_HITZONES: MhHitzone[] = [
  { part: "Cabeza", sever: 70, blunt: 65, shot: 60, fire: 15, water: 25, thunder: 30, ice: 25, dragon: 35, stun: 100, weakest: true },
  { part: "Cuello", sever: 50, blunt: 48, shot: 45, fire: 10, water: 20, thunder: 25, ice: 20, dragon: 30 },
  { part: "Alas", sever: 45, blunt: 40, shot: 38, water: 15, thunder: 20, ice: 15, dragon: 25 },
  { part: "Cola", sever: 40, blunt: 35, shot: 30, water: 15, thunder: 15, ice: 15, dragon: 20 },
  { part: "Torso", sever: 32, blunt: 35, shot: 30, water: 10, thunder: 15, ice: 10, dragon: 15 },
  { part: "Patas", sever: 30, blunt: 28, shot: 25, water: 10, thunder: 15, ice: 10, dragon: 15 },
]
const DIABLOS_HITZONES: MhHitzone[] = [
  { part: "Cabeza", sever: 42, blunt: 62, shot: 40, fire: 10, water: 20, thunder: 15, ice: 30, dragon: 25, stun: 100, weakest: true },
  { part: "Cuernos", sever: 20, blunt: 35, shot: 15, ice: 20, dragon: 15 },
  { part: "Torso", sever: 40, blunt: 38, shot: 35, water: 15, ice: 25, dragon: 15 },
  { part: "Alas", sever: 45, blunt: 40, shot: 42, water: 20, ice: 30, dragon: 20 },
  { part: "Cola", sever: 35, blunt: 30, shot: 28, ice: 20, dragon: 15 },
  { part: "Patas", sever: 34, blunt: 30, shot: 30, ice: 20, dragon: 15 },
]
const ANJA_STATUSES = { poison: { eff: 2 }, sleep: { eff: 1 }, paralysis: { eff: 2 }, blast: { eff: 3 }, stun: { eff: 2 }, exhaust: { eff: 1 } }
const RATH_REWARDS: MhReward[] = [
  { item: { name: "Escama de Rathalos", rarity: 5 }, conditions: [{ type: "carve", chance: 36, quantity: 2 }, { type: "reward", chance: 28, quantity: 1 }] },
  { item: { name: "Caparazón de Rathalos", rarity: 5 }, conditions: [{ type: "carve", chance: 24, quantity: 1 }, { type: "break", chance: 60, quantity: 1, subtype: "cabeza" }] },
  { item: { name: "Membrana de Rathalos", rarity: 6 }, conditions: [{ type: "break", chance: 35, quantity: 1, subtype: "alas" }] },
  { item: { name: "Rubí de fuego", rarity: 7 }, conditions: [{ type: "reward", chance: 5, quantity: 1 }, { type: "carve", chance: 3, quantity: 1 }] },
  { item: { name: "Placa de Rathalos", rarity: 7 }, conditions: [{ type: "reward", chance: 8, quantity: 1 }] },
]
const RATH_BREAKS: MhBreak[] = [
  { part: "Cabeza", impact: 3, effect: "Rompible dos veces. Aumenta la caída de escamas y facilita el aturdimiento.", unlocks: [{ name: "Caparazón de Rathalos", rarity: 5 }] },
  { part: "Alas", impact: 2, effect: "Al romperlas, el Rathalos vuela menos y cae al suelo con más frecuencia.", unlocks: [{ name: "Membrana de Rathalos", rarity: 6 }] },
  { part: "Cola", impact: 2, effect: "Se puede cortar en el suelo para obtener material extra único de la cola.", unlocks: [{ name: "Cola de Rathalos", rarity: 5 }] },
]
const RATH_DANGER = { name: "Picado en llamas", tell: "Se eleva y marca al cazador con un breve destello antes de lanzarse en diagonal.", counter: "Rueda lateralmente en el último instante; deja el flanco expuesto para un golpe cargado." }

// MH accent tokens (set by the MH shell on the live tool; set here so the
// specimens render identically inside the showcase).
const MH_VARS = {
  ["--mh" as string]: "hsl(152 52% 46%)",
  ["--mh-bright" as string]: "hsl(152 58% 56%)",
  ["--mh-soft" as string]: "hsl(152 52% 46% / 0.13)",
  ["--mh-line" as string]: "hsl(152 52% 46% / 0.4)",
} as React.CSSProperties

// Demo monsters shaped to the MH DB schema; threat/title/flagship are [deferred]
// editorial fields (not in the API) — showcase only.
const base = {
  id: 0,
  kind: "large",
  description: "",
  baseHealth: 4000,
  size: { base: 1700, mini: 1450, silver: 1850, gold: 1950 },
  ailments: [] as unknown[],
  resistances: [],
  rewards: [],
}

const rathalos: MhMonster = {
  ...base,
  id: 1,
  species: "flying-wyvern",
  name: "Rathalos",
  title: "Rey de los Cielos",
  threat: 4,
  elements: ["fire"],
  weaknesses: [
    { id: 1, kind: "element", element: "dragon", level: 3 },
    { id: 2, kind: "element", element: "thunder", level: 2 },
    { id: 3, kind: "element", element: "ice", level: 1 },
    { id: 4, kind: "status", status: "poison", level: 2 },
  ],
  locations: [{ id: 1, name: "Bosque Escarlata", zoneCount: 17 }],
}

const arkveld: MhMonster = {
  ...base,
  id: 2,
  species: "wraith",
  name: "Arkveld",
  title: "Espectro Blanco",
  threat: 4,
  flagship: true,
  elements: ["dragon"],
  weaknesses: [
    { id: 1, kind: "element", element: "dragon", level: 3 },
    { id: 2, kind: "element", element: "thunder", level: 2 },
    { id: 3, kind: "element", element: "ice", level: 2 },
  ],
  locations: [{ id: 1, name: "Manto de Cenizas", zoneCount: 12 }],
}

const anjanath: MhMonster = {
  ...base,
  id: 3,
  species: "brute-wyvern",
  name: "Anjanath",
  threat: 2,
  weaknesses: [
    { id: 1, kind: "element", element: "water", level: 3 },
    { id: 2, kind: "element", element: "ice", level: 2 },
    { id: 3, kind: "element", element: "thunder", level: 2 },
  ],
  locations: [{ id: 1, name: "Llanuras del Viento", zoneCount: 9 }],
}

const teostra: MhMonster = {
  ...base,
  id: 4,
  species: "elder-dragon",
  name: "Teostra",
  threat: 5,
  elements: ["fire"],
  weaknesses: [
    { id: 1, kind: "element", element: "ice", level: 2 },
    { id: 2, kind: "element", element: "water", level: 2 },
    { id: 3, kind: "element", element: "dragon", level: 1 },
  ],
  locations: [{ id: 1, name: "Cuenca Putrefacta", zoneCount: 14 }],
}

export function BestiarioChapter() {
  const [active, setActive] = React.useState(1)
  const [tab, setTab] = React.useState("overview")
  const rathWeak = rathalos.weaknesses.filter((w) => w.kind === "element").map((w) => ({ element: w.element ?? "", stars: w.level ?? 0 }))
  return (
    <div style={MH_VARS}>
      <Section
        id="mbroster"
        kicker="Bestiario"
        title="Roster y amenaza"
        lead={<>La tarjeta de monstruo (<code>MonsterCard</code>) en variante rejilla y fila, teñida por especie y con nivel de amenaza. La insignia de amenaza (<code>MhThreatBadge</code>), la etiqueta de especie (<code>MhSpeciesTag</code>) y las estrellas (<code>MhStars</code>) son átomos reutilizables. <em>threat</em>, <em>título</em> e <em>insignia</em> son campos editoriales <code>[deferred]</code>, opcionales cuando la API no los da.</>}
      >
        <Sample title="Tarjeta de monstruo — rejilla / fila" code="<MonsterCard m active onClick>" col>
          <div className="grid gap-[0.625rem] w-full [grid-template-columns:repeat(auto-fit,minmax(10rem,11.25rem))]">
            <MonsterCard m={rathalos} active={active === 1} onClick={() => setActive(1)} />
            <MonsterCard m={arkveld} active={active === 2} onClick={() => setActive(2)} />
          </div>
          <div className="grid gap-2 w-full">
            <MonsterRow m={anjanath} active={active === 3} onClick={() => setActive(3)} />
            <MonsterRow m={teostra} active={active === 4} onClick={() => setActive(4)} />
          </div>
        </Sample>
        <Sample title="Insignia de amenaza · especie · estrellas" code="<MhThreatBadge> <MhSpeciesTag> <MhStars>">
          <MhThreatBadge threat={2} />
          <MhThreatBadge threat={4} />
          <MhThreatBadge threat={5} />
          <MhSpeciesTag species="flying-wyvern" />
          <MhSpeciesTag species="elder-dragon" />
          <MhStars value={2} max={3} />
          <MhStars value={3} max={3} />
        </Sample>
      </Section>

      <Section
        id="mbweak"
        kicker="Bestiario"
        title="Debilidades e hitzones"
        lead={<>La rejilla de debilidad elemental (<code>MhWeaknessGrid</code>), la vulnerabilidad a estados (<code>MhStatusVulns</code>), y el análisis de puntos de impacto en dos densidades: escaneo casual (<code>MhHitzoneScan</code>) y tabla exacta (<code>MhHitzoneTable</code>).</>}
      >
        <Sample title="Rejilla de debilidad elemental" code="<MhWeaknessGrid weaknesses>" col>
          <div className="w-full max-w-[38.75rem]">
            <MhWeaknessGrid weaknesses={rathWeak} />
          </div>
        </Sample>
        <Sample title="Vulnerabilidad a estados" code="<MhStatusVulns statuses>" col>
          <div className="w-full max-w-[26.25rem]">
            <MhStatusVulns statuses={ANJA_STATUSES} />
          </div>
        </Sample>
        <Sample title="Escaneo casual de hitzones" code="<MhHitzoneScan hitzones>" col note="Vista guiada: ordena las partes por mejor daño físico. En modo Analista se cambia por la tabla exacta.">
          <div className="w-full max-w-[32.5rem]">
            <MhHitzoneScan hitzones={RATH_HITZONES} />
          </div>
        </Sample>
        <Sample title="Tabla exacta de hitzones" code="<MhHitzoneTable hitzones columns>" col>
          <div className="w-full">
            <MhHitzoneTable hitzones={DIABLOS_HITZONES} />
          </div>
        </Sample>
      </Section>

      <Section
        id="mbdrops"
        kicker="Bestiario"
        title="Botín y roturas"
        lead={<>La tabla de botín (<code>MhDropTable</code>) con la insignia de probabilidad (<code>MhDropChance</code>) coloreada por rareza de obtención, y el panel de partes rompibles (<code>MhBreakPanel</code>) con prioridad de impacto y materiales desbloqueados.</>}
      >
        <Sample title="Insignia de probabilidad de botín" code="<MhDropChance chance rare>">
          <MhDropChance chance={60} />
          <MhDropChance chance={28} />
          <MhDropChance chance={8} />
          <MhDropChance chance={5} rare />
        </Sample>
        <Sample title="Tabla de botín" code="<MhDropTable rewards typeFilter rankFilter>" col>
          <div className="w-full">
            <MhDropTable rewards={RATH_REWARDS} />
          </div>
        </Sample>
        <Sample title="Partes rompibles" code="<MhBreakPanel breaks>" col>
          <div className="w-full">
            <MhBreakPanel breaks={RATH_BREAKS} />
          </div>
        </Sample>
      </Section>

      <Section
        id="mbstrat"
        kicker="Bestiario"
        title="Estrategia y pestañas"
        lead={<>El sistema de pestañas genérico (<code>MhTabs</code>), la tarjeta de ataque peligroso (<code>MhDangerCard</code>), el badge de elemento (<code>MhElemBadge</code>), la etiqueta de alteración (<code>MhAilmentTag</code>), el bloque de datos (<code>MhStatBlock</code>) y la fila de equipo relacionado (<code>MhRelGear</code>).</>}
      >
        <Sample title="Sistema de pestañas" code="<MhTabs tabs value onChange>" col>
          <MhTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "overview", label: "Resumen", icon: "info" },
              { id: "weakness", label: "Debilidades", icon: "target" },
              { id: "drops", label: "Botín", icon: "gift", count: 5 },
              { id: "strategy", label: "Estrategia", icon: "crosshair" },
            ]}
          />
        </Sample>
        <Sample title="Elemento · alteración · etiqueta" code="<MhElemBadge> <MhAilmentTag> <MhTag2>">
          <MhElemBadge element="dragon" stars={3} />
          <MhElemBadge element="thunder" />
          <MhAilmentTag id="fireblight" />
          <MhAilmentTag id="paralysis" />
          <MhTag2 icon="sword" tone="good">
            Corte
          </MhTag2>
        </Sample>
        <Sample title="Ataque peligroso → respuesta" code="<MhDangerCard danger>" col>
          <div className="w-full max-w-[28.75rem]">
            <MhDangerCard danger={RATH_DANGER} />
          </div>
        </Sample>
        <Sample title="Bloque de datos · equipo relacionado" code="<MhStatBlock> <MhRelGear>" col>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <MhStatBlock
              items={[
                { icon: "layers", label: "Clasificación", value: "Wyvern volador" },
                { icon: "alert", label: "Amenaza", value: "Ápex" },
                { icon: "crosshair", label: "Tamaño base", value: "1704 cm" },
              ]}
            />
            <div className="flex flex-col gap-1.5">
              <MhRelGear icon="sword" name="Filo de Rathalos III" meta="Espada larga · ATQ 230 · Fuego" onClick={() => {}} />
              <MhRelGear icon="shield" name="Serie Rathalos" meta="5 piezas · R8 · Poder de Rathalos" onClick={() => {}} />
            </div>
          </div>
        </Sample>
      </Section>
    </div>
  )
}
