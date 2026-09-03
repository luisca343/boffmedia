"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  MhCatLegend,
  MhDecoSocket,
  MhElement,
  MhEquipItem,
  MhMaterial,
  MhNodeCard,
  MhRarity,
  MhResistances,
  MhSetBonus,
  MhSharpness,
  MhSkeletonSlots,
  MhSkillRow,
  MhSlot,
  MhSlotPips,
  MhStat3,
} from "@boffmedia/tools-mhwilds/ui/mh-kit"
import { MH_VARS } from "@boffmedia/tools-mhwilds/ui/mh-helpers"

const RES_LABELS: Record<string, string> = { fire: "Fuego", water: "Agua", thunder: "Rayo", ice: "Hielo", dragon: "Dragón" }
const CAT_LABELS = { attack: "Ofensiva", element: "Elemental", defense: "Defensiva", utility: "Utilidad" }

// Demo weapon / armor for the specimens. Real builds come from the planner store. [deferred]
const WP = {
  name: "Filo del Rey Cielo",
  rarity: 7,
  attack: 210,
  affinity: 15,
  special: { type: "fire", value: 240 },
  sharpness: { green: 40, blue: 60, white: 50, purple: 20 },
  slots: [3, 1, 0],
  skills: [{ name: "Ataque", level: 3 }, { name: "Vista Crítica", level: 2 }],
}
const ARMOR = { name: "Yelmo de Rathalos α", rarity: 7, defense: 96, slots: [2, 1, 0], skills: [{ name: "Maestría", level: 1 }] }

const NODE_A = { name: "Filo del Rey Cielo", rarity: 7, attack: 210, special: { type: "fire", value: 240 } }
const NODE_B = { name: "Espada de Rathian", rarity: 5, attack: 168, special: { type: "poison", value: 180 } }
const NODE_C = { name: "Sable de Hierro III", rarity: 3, attack: 132, special: null }

const MATERIALS = [
  { id: "escama", name: "Escama+ de Rathalos", rarity: 6, quantity: 4 },
  { id: "garra", name: "Garra de Rathalos", rarity: 5, quantity: 2 },
  { id: "ala", name: "Membrana alar de Rathalos", rarity: 6, quantity: 3 },
  { id: "gema", name: "Gema de Rathalos", rarity: 8, quantity: 1 },
]

export function PlanificadorMhChapter() {
  const [owned, setOwned] = React.useState<Record<string, boolean>>({ escama: true })

  return (
    <div style={MH_VARS}>
      <Section
        id="mhequip"
        kicker="Monster Hunter"
        title="Equipo y selector"
        lead={<>Las piezas base del planificador: la ranura de equipo (<code>MhSlot</code>) con barra de acento y estado lleno / vacío, la fila del selector en el cajón (<code>MhEquipItem</code>) con rareza, habilidades y ranuras, y el sello de rareza (<code>MhRarity</code>) del ramp 1–8.</>}
      >
        <Sample title="Ranura de equipo" code="<MhSlot icon kind name filled onOpen>" col>
          <div className="grid max-w-[27.5rem] gap-2">
            <MhSlot icon="sword" kind="Arma" name={WP.name} rarity={WP.rarity} filled active onOpen={() => {}} />
            <MhSlot icon="sparkles" kind="Talismán" name="Ranura vacía" filled={false} active={false} onOpen={() => {}} />
          </div>
        </Sample>
        <Sample title="Fila del selector" code="<MhEquipItem item kind>" col>
          <div className="flex max-w-[28.75rem] flex-col gap-[0.4375rem]">
            <MhEquipItem item={WP} kind="weapon" active onPick={() => {}} />
            <MhEquipItem item={ARMOR} kind="armor" onPick={() => {}} />
          </div>
        </Sample>
        <Sample title="Sello de rareza y ranuras" code="<MhRarity> · <MhSlotPips>">
          {[1, 3, 5, 7, 8].map((r) => <MhRarity key={r} rarity={r} />)}
          <span className="ml-3">
            <MhSlotPips slots={[3, 1, 0]} />
          </span>
        </Sample>
      </Section>

      <Section
        id="mhstats"
        kicker="Monster Hunter"
        title="Stats, afilado y resistencias"
        lead={<>La lectura en vivo del arma y la defensa: tríada de estadísticas (<code>MhStat3</code>), chip de elemento / estado (<code>MhElement</code>), barra de afilado de 7 tramos con extensión de Artesanía (<code>MhSharpness</code>) y la fila de resistencias elementales (<code>MhResistances</code>).</>}
      >
        <Sample title="Tríada y elemento" code="<MhStat3> · <MhElement>" col>
          <div className="w-full max-w-[26.25rem]">
            <MhStat3
              items={[
                { value: WP.attack, label: "Ataque", mod: "attack" },
                { value: `+${WP.affinity}%`, label: "Afinidad", color: "var(--ok)" },
                { value: 2, label: "Ranuras" },
              ]}
            />
            <div className="mt-3">
              <MhElement type={WP.special.type} value={WP.special.value} label="Fuego" />
            </div>
          </div>
        </Sample>
        <Sample title="Afilado" code="<MhSharpness sharpness legend>" col>
          <div className="w-full max-w-[26.25rem]">
            <MhSharpness sharpness={WP.sharpness} legend="Blanco con Artesanía +2" />
          </div>
        </Sample>
        <Sample title="Resistencias" code="<MhResistances res>" col>
          <div className="w-full max-w-[26.25rem]">
            <MhResistances res={{ fire: 3, water: -1, thunder: 0, ice: -2, dragon: 1 }} labelFor={(k) => RES_LABELS[k] ?? k} />
          </div>
        </Sample>
      </Section>

      <Section
        id="mhskills"
        kicker="Monster Hunter"
        title="Habilidades y bonus"
        lead={<>La fila de habilidad (<code>MhSkillRow</code>) muestra pips por nivel teñidos por categoría, con marca de exceso cuando se supera el tope; el bonus de conjunto (<code>MhSetBonus</code>) indica piezas activas frente a requeridas; la ranura de joya (<code>MhDecoSocket</code>) engarza decoraciones.</>}
      >
        <Sample title="Habilidades activas" code="<MhSkillRow name level maxLevel>" col>
          <div className="grid w-full max-w-[27.5rem] gap-2">
            <MhSkillRow name="Ataque" level={5} maxLevel={5} kind="offensive" desc="+20 al ataque base." />
            <MhSkillRow name="Vista Crítica" level={7} maxLevel={5} kind="offensive" desc="Aumenta la afinidad; supera el tope." />
            <MhSkillRow name="Ataque de Fuego" level={2} maxLevel={5} kind="element" desc="Refuerza el daño de fuego." />
            <MhSkillRow name="Manejo" level={2} maxLevel={3} kind="utility" desc="Reduce el rebote." />
          </div>
          <div className="mt-3">
            <MhCatLegend labels={CAT_LABELS} />
          </div>
        </Sample>
        <Sample title="Bonus de conjunto" code="<MhSetBonus bonus>" col>
          <div className="grid w-full max-w-[27.5rem] gap-2">
            <MhSetBonus bonus={{ bonusName: "Poder de Rathalos", pieces: 4, activeAt: 2, nextAt: 4, skill: { name: "Maestría de Fuego" } }} />
            <MhSetBonus bonus={{ bonusName: "Furia del Diablos", pieces: 2, activeAt: null, nextAt: 3, skill: null }} />
          </div>
        </Sample>
        <Sample title="Ranura de joya" code="<MhDecoSocket size decoName>" col>
          <div className="grid w-full max-w-[27.5rem] gap-[0.3125rem]">
            <MhDecoSocket size={3} decoName="Joya de Ataque III" decoSlot={3} onOpen={() => {}} onClear={() => {}} />
            <MhDecoSocket size={2} decoName={null} onOpen={() => {}} />
          </div>
        </Sample>
      </Section>

      <Section
        id="mhtreepieces"
        kicker="Monster Hunter"
        title="Nodo de árbol y materiales"
        lead={<>La tarjeta del árbol de armas (<code>MhNodeCard</code>) — teñida por rareza, con marca de arma final y punto de «forjada» — y la fila de material (<code>MhMaterial</code>) con gema de rareza y contador, opcionalmente con seguimiento de obtenidos. El esqueleto (<code>MhSkeletonSlots</code>) cubre la carga.</>}
      >
        <Sample title="Nodo del árbol" code="<MhNodeCard node selected owned isFinal>" col>
          <div className="relative flex min-h-[5rem] flex-wrap gap-[1.125rem]">
            <MhNodeCard {...NODE_A} style={{ position: "relative", left: 0, top: 0, width: 212 } as React.CSSProperties} selected owned isFinal finalLabel="Final" dim={false} onSelect={() => {}} />
            <MhNodeCard {...NODE_B} style={{ position: "relative", left: 0, top: 0, width: 212 } as React.CSSProperties} selected={false} owned={false} isFinal={false} finalLabel="Final" dim={false} onSelect={() => {}} />
            <MhNodeCard {...NODE_C} style={{ position: "relative", left: 0, top: 0, width: 212 } as React.CSSProperties} selected={false} owned={false} isFinal={false} finalLabel="Final" dim onSelect={() => {}} />
          </div>
        </Sample>
        <Sample title="Materiales de forja" code="<MhMaterial material onToggle>" col note="Con <code>onToggle</code> aparece la casilla de seguimiento; sin ella, la fila es de solo lectura (detalle de un nodo).">
          <div className="grid w-full max-w-[27.5rem] gap-2">
            {MATERIALS.map((m, i) => (
              <MhMaterial
                key={m.id}
                name={m.name}
                rarity={m.rarity}
                quantity={m.quantity}
                owned={!!owned[m.id]}
                onToggle={i < 2 ? () => setOwned((o) => ({ ...o, [m.id]: !o[m.id] })) : undefined}
              />
            ))}
          </div>
        </Sample>
        <Sample title="Estado de carga" code="<MhSkeletonSlots n>" col>
          <div className="w-full max-w-[27.5rem]">
            <MhSkeletonSlots n={3} />
          </div>
        </Sample>
      </Section>
    </div>
  )
}
