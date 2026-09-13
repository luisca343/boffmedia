"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import {
  MhElderseal,
  MhPieceRow,
  MhSetBonusDetail,
  MhSetCard,
  MhSharpHandicraft,
  MhSkillChip,
  MhStatBar,
  MhWeaponCard,
  MhWeaponExtra,
} from "@/components/boffmedia/ui/mh-db"
import { MHDB, MH_MAX_DEF } from "./mh-db-demo"
import type { ArmorPiece, Weapon } from "@boffmedia/tools-mhwilds/types"
import { mhwildsArmorAsset, mhwildsWeaponAsset } from "@boffmedia/tools-mhwilds/bestiary/assets"
import { WishlistItemVisual } from "@boffmedia/tools-mhwilds/planner/_components/WishlistItemVisual"

// MH emerald accent tokens (mirrors mh.css :root; scoped so mh-db components tint
// correctly on the showcase page — same pattern as BestiarioChapter).
const MH_VARS = {
  ["--mh" as string]: "hsl(152 52% 46%)",
  ["--mh-bright" as string]: "hsl(152 58% 56%)",
  ["--mh-soft" as string]: "hsl(152 52% 46% / 0.13)",
  ["--mh-line" as string]: "hsl(152 52% 46% / 0.4)",
} as React.CSSProperties

const ASSET_WEAPON: Weapon = {
  id: 32,
  gameId: 32,
  kind: "great-sword",
  name: "Rathalos Firesword",
  rarity: 7,
  damage: { display: 462, raw: 462 },
  affinity: 0,
  slots: [3, 1, 0],
  localAssetPath: "gear/weapons/great-sword/rathalos-firesword.png",
}

const ASSET_ARMOR: ArmorPiece = {
  id: 1769659776,
  name: "Rathalos alpha helm",
  kind: "head",
  rank: "high",
  rarity: 7,
  defense: { base: 96 },
  resistances: { fire: 3, water: -1, thunder: 0, ice: -2, dragon: 1 },
  slots: [2, 1, 0],
  skills: [],
  localAssetPath: "gear/armor/rathalos-alpha/head.png",
}

export function ArmeriaMhChapter() {
  const [sel, setSel] = React.useState(true)
  const set = MHDB.armorSet(1)
  const setProfile = MHDB.armorSetProfile(1)
  const piece = MHDB.armor(102)
  const wFire = MHDB.weapon(1006)
  const wBow = MHDB.weapon(4005)
  const wCb = MHDB.weapon(6003)
  const wHh = MHDB.weapon(7003)
  const weaponAsset = mhwildsWeaponAsset(ASSET_WEAPON)
  const armorAsset = mhwildsArmorAsset(ASSET_ARMOR)

  return (
    <div style={MH_VARS}>
      <Section
        id="mhdbsets"
        kicker="Monster Hunter"
        title="Catálogo de armadura"
        lead={
          <>
            Las piezas de la base de datos de armadura: la tarjeta de conjunto (<code>&lt;MhSetCard&gt;</code>) en cuadrícula y en lista, teñida por el tono de serie; la escalera de bonus de conjunto/grupo (<code>&lt;MhSetBonusDetail&gt;</code>) con requisitos por piezas; y la fila de pieza (<code>&lt;MhPieceRow&gt;</code>) con habilidades y ranuras.
          </>
        }
      >
        <Sample title="Tarjeta de conjunto" code="<MhSetCard set view>" col>
          <div className="grid w-full max-w-[26.25rem] gap-[0.5625rem] [grid-template-columns:repeat(auto-fill,minmax(11.25rem,1fr))]">
            <MhSetCard set={set} active onOpen={() => {}} view="grid" />
            <MhSetCard set={MHDB.armorSet(3)} onOpen={() => {}} view="grid" />
          </div>
          <div className="mt-2.5 grid w-full max-w-[26.25rem] gap-1.5">
            <MhSetCard set={MHDB.armorSet(2)} onOpen={() => {}} view="list" />
          </div>
        </Sample>
        <Sample title="Escalera de bonus" code="<MhSetBonusDetail bonus kind>" col>
          <div className="grid w-full max-w-[27.5rem] gap-2.5">
            {set.bonus && <MhSetBonusDetail bonus={set.bonus} kind="set" activePieces={4} />}
            {MHDB.armorSet(3).group && <MhSetBonusDetail bonus={MHDB.armorSet(3).group!} kind="group" activePieces={2} />}
          </div>
        </Sample>
        <Sample title="Fila de pieza" code="<MhPieceRow piece>" col note="Con <code>activePieces</code>, la escalera de bonus resalta los rangos ya activos; sin él, muestra todos los rangos atenuados.">
          <div className="grid w-full max-w-[28.75rem] gap-0">
            <MhPieceRow piece={piece} />
            <MhPieceRow piece={MHDB.armor(105)} />
          </div>
        </Sample>
      </Section>

      <Section
        id="mhdbassets"
        kicker="Monster Hunter"
        title="Renders canónicos de gear"
        lead={<>El pipeline de assets une cada arma y pieza con su <code>localAssetPath</code> estable. El PNG conserva transparencia y se compone directamente sobre la superficie de la tarjeta.</>}
      >
        <Sample title="Arma y pieza con arte extraído" code="<mhwildsWeaponAsset> <mhwildsArmorAsset>" col>
          <div className="grid w-full max-w-[38rem] grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border border-solid border-line bg-panel p-3">
              <div className="grid min-h-[11rem] place-items-center">
                {weaponAsset ? <img src={weaponAsset} alt={ASSET_WEAPON.name} width={180} height={180} draggable={false} className="h-40 w-full object-contain" /> : <span className="font-mono text-[0.6875rem] text-txt-dim">Sin asset</span>}
              </div>
              <div className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-muted">{ASSET_WEAPON.name}</div>
            </div>
            <div className="border border-solid border-line bg-panel p-3">
              <div className="grid min-h-[11rem] place-items-center">
                {armorAsset ? <img src={armorAsset} alt={ASSET_ARMOR.name} width={180} height={180} draggable={false} className="h-40 w-full object-contain" /> : <span className="font-mono text-[0.6875rem] text-txt-dim">Sin asset</span>}
              </div>
              <div className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-muted">{ASSET_ARMOR.name}</div>
            </div>
          </div>
        </Sample>
        <Sample title="Visual de wishlist" code="<WishlistItemVisual kind item>">
          <div className="flex flex-wrap items-center gap-3">
            <WishlistItemVisual kind="weapon" item={ASSET_WEAPON} />
            <WishlistItemVisual kind="armor" item={ASSET_ARMOR} />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-muted">Arma · armadura · fallback semántico</span>
          </div>
        </Sample>
      </Section>

      <Section
        id="mhdbskills"
        kicker="Monster Hunter"
        title="Habilidades y fuentes"
        lead={
          <>
            El chip de habilidad teñido por categoría (<code>&lt;MhSkillChip&gt;</code>) — con nivel opcional — es la unidad del buscador inverso; la barra de estadística (<code>&lt;MhStatBar&gt;</code>) compara un valor contra una escala (defensa, ataque…).
          </>
        }
      >
        <Sample title="Chip de habilidad" code="<MhSkillChip skill level>">
          {setProfile.skills.slice(0, 5).map((x) => (
            <MhSkillChip key={x.skill.id} skill={x.skill} level={x.level} />
          ))}
          <MhSkillChip skill={MHDB.skill(2)} />
        </Sample>
        <Sample title="Barra de estadística" code="<MhStatBar label value max>" col>
          <div className="grid w-full max-w-[27.5rem] gap-2">
            <MhStatBar label="Defensa" value={setProfile.defense.base} max={MH_MAX_DEF} color="var(--info)" />
            <MhStatBar label="Máxima" value={setProfile.defense.max} max={MH_MAX_DEF} color="var(--mh)" />
            <MhStatBar label="Ataque" value={wFire.attack} max={520} color="#ff7a5c" />
          </div>
        </Sample>
      </Section>

      <Section
        id="mhdbweapons"
        kicker="Monster Hunter"
        title="Armas y afilado"
        lead={
          <>
            La tarjeta de arma de la Armería (<code>&lt;MhWeaponCard&gt;</code>) — con casilla de comparación opcional — en cuadrícula y lista; el explorador interactivo de afilado + Artesanía (<code>&lt;MhSharpHandicraft&gt;</code>) con niveles pulsables; y el sello ancestral (<code>&lt;MhElderseal&gt;</code>).
          </>
        }
      >
        <Sample title="Tarjeta de arma" code="<MhWeaponCard weapon selectable>" col>
          <div className="grid w-full max-w-[27.5rem] gap-[0.5625rem] [grid-template-columns:repeat(auto-fill,minmax(10rem,1fr))]">
            <MhWeaponCard weapon={wFire} active onOpen={() => {}} view="grid" selectable selected={sel} onToggleSelect={() => setSel((v) => !v)} />
            <MhWeaponCard weapon={MHDB.weapon(5006)} onOpen={() => {}} view="grid" selectable onToggleSelect={() => {}} />
          </div>
          <div className="mt-2.5 grid w-full max-w-[27.5rem] gap-1.5">
            <MhWeaponCard weapon={wCb} onOpen={() => {}} view="list" />
          </div>
        </Sample>
        <Sample title="Afilado + Artesanía" code="<MhSharpHandicraft weapon>" col note="Estado interno: pulsa un nivel de Artesanía y la barra interpola entre el afilado base y el máximo.">
          <div className="w-full max-w-[27.5rem]">
            <MhSharpHandicraft weapon={wFire} defaultLevel={2} />
          </div>
        </Sample>
        <Sample title="Sello ancestral" code="<MhElderseal value>">
          <MhElderseal value="low" />
          <MhElderseal value="average" />
          <MhElderseal value="high" />
        </Sample>
      </Section>

      <Section
        id="mhdbtype"
        kicker="Monster Hunter"
        title="Datos por tipo de arma"
        lead={
          <>
            Un solo componente (<code>&lt;MhWeaponExtra&gt;</code>) despacha los datos específicos de cada tipo: recubrimientos del arco, vial de la espada carga, y notas + cantos del cuerno de caza.
          </>
        }
      >
        <Sample title="Recubrimientos · arco" code="<MhWeaponExtra weapon>" col>
          <div className="w-full max-w-[27.5rem]">
            <MhWeaponExtra weapon={wBow} />
          </div>
        </Sample>
        <Sample title="Vial · espada carga" code="<MhWeaponExtra weapon>" col>
          <div className="w-full max-w-[27.5rem]">
            <MhWeaponExtra weapon={wCb} />
          </div>
        </Sample>
        <Sample title="Melodía y cantos · cuerno" code="<MhWeaponExtra weapon>" col>
          <div className="w-full max-w-[27.5rem]">
            <MhWeaponExtra weapon={wHh} />
          </div>
        </Sample>
      </Section>
    </div>
  )
}
