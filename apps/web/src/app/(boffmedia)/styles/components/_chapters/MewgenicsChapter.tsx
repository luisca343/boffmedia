"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { Icon, ChipGroup, DataList, SearchInput } from "@/components/boffmedia/primitives"
import {
  CxCard,
  MewEffects,
  MewFaction,
  MewHoverCard,
  MewKind,
  MewNote,
  MewPanel,
  MewPopCard,
  MewRarity,
  MewRef,
  MewRefLink,
  MewSetTag,
  MewStats,
  MewText,
  MewTile,
  MEW_VARS,
  type MewRec,
} from "@/components/boffmedia/ui/mewgenics"

// Demo records (mock — meta is static, no dataset). [deferred]
const ITEM: MewRec = { id: "SkullCap", name: "Skull Cap", kind: "head", rarity: "common" }
const ITEM2: MewRec = { id: "CursedFiddle", name: "Cursed Fiddle", kind: "trinket", rarity: "very_rare" }
const CHAR: MewRec = { id: "Rat", name: "Lil' Rat", faction: "enemies", hp: 6 }
const EFFECTS = { Brace: 4, Thorns: 2, StatusOnBreak: { HealthRegenUp: 3, IntelligenceUp: 1 }, CanMutateTo: ["Lumpy", "Leaper"] }
const STATS = { strength: 7, dexterity: 5, constitution: 8, intelligence: 3, speed: 5, charisma: 5, luck: 5 }
const TEXT = "Breaks when [img:shield] is depleted.\nWhen it breaks, gain +1 [img:int] and +3 Health Regen for the rest of the battle."

const ABILITY: MewRec = { id: "PounceAttack", name: "Zarpazo en salto", cls: "WarriorAbility", desc: "Salta hacia el objetivo y golpea con las garras, aplicando sangrado.", cost: { act_points: 2, move_points: 1 }, target: { target_mode: "single", min_range: 2, max_range: 4 }, dmg: { damage: "3-5", type: "physical", effects: { Bleed: 2, Stagger: 1 } } }
const PASSIVE: MewRec = { id: "Barbed", name: "Con púas", cls: "Warrior", desc: "Cuando esta unidad recibe daño cuerpo a cuerpo, devuelve espinas al atacante.", base: { Thorns: 2 }, ranks: [{ r: 1 }, { r: 2 }, { r: 3 }] }
const KEYWORD: MewRec = { id: "Bleed", name: "Sangrado", tip: "Al inicio de su turno, la unidad pierde 1 de salud por cada acumulación de sangrado. Se reduce en 1 cada turno." }
const ITEM_D: MewRec = { id: "SkullCap", name: "Casco de calavera", kind: "head", rarity: "common", shield: 4, desc: "Otorga escudo al inicio del combate. Se rompe cuando el escudo se agota.", passives: { Brace: 2, Thorns: 1 } }
const SET: MewRec = {
  id: "Bone",
  name: "Hueso",
  members: [
    { id: "BonesHat", name: "Sombrero de huesos", kind: "head" },
    { id: "BonesMask", name: "Máscara de huesos", kind: "face" },
    { id: "BonesNeck", name: "Collar de huesos", kind: "neck" },
    { id: "AncestorsSkull", name: "Cráneo ancestral", kind: "head" },
    { id: "AncestorsJaw", name: "Mandíbula ancestral", kind: "face" },
    { id: "RibCage", name: "Caja torácica", kind: "neck" },
  ],
}

export function MewgenicsChapter() {
  const [q, setQ] = React.useState("Rifle")
  const [kind, setKind] = React.useState("head")
  const [rars, setRars] = React.useState<string[]>(["rare"])

  return (
    <div style={MEW_VARS}>
      <Section
        id="mewpapel"
        kicker="Mewgenics"
        title="Papel y fichas"
        lead={
          <>
            El Codex viste un lenguaje propio de <strong>papel y tinta</strong>: fichas de papel hueso con contorno entintado y radios irregulares (<code>--wob-*</code>), cinta adhesiva en los paneles, rotaciones alternas de pegatina y enlaces con subrayado ondulado. El rojo rotulador marca conteos, números y estados activos; el hue del dato sigue tiñendo teselas y pegatinas.
          </>
        }
      >
        <Sample title={`CxCard · rejilla`} code={`<CxCard cat rec view="grid" />`} note="Tarjeta del listado. La activa recibe un halo del hue de su dato.">
          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,156px)]">
            <CxCard cat="items" rec={ITEM} view="grid" onOpen={() => {}} />
            <CxCard cat="items" rec={ITEM2} view="grid" onOpen={() => {}} />
            <CxCard cat="characters" rec={CHAR} view="grid" active onOpen={() => {}} />
          </div>
        </Sample>
        <Sample title={`CxCard · lista`} code={`<CxCard cat rec view="list" />`} col>
          <div className="grid w-full max-w-[400px] gap-2">
            <CxCard cat="items" rec={ITEM} view="list" onOpen={() => {}} />
            <CxCard cat="characters" rec={CHAR} view="list" onOpen={() => {}} />
          </div>
        </Sample>
        <Sample title="Panel con cinta y nota" code="<MewPanel> · <MewNote>" col note="Cada panel es una hoja pegada con cinta y cabecera de trazo discontinuo. La nota al margen va en cursiva con borde discontinuo.">
          <div className="w-full max-w-[480px] pt-3">
            <MewPanel title="Datos" icon="database" count={3}>
              <DataList
                rows={[
                  { label: "Facción", value: <MewFaction faction="enemies" /> },
                  { label: "Salud", value: 5 },
                  { label: "ID", value: "Rat", mono: true },
                ]}
              />
              <MewNote>Las habilidades activas no traen ficha propia en el conjunto de datos.</MewNote>
            </MewPanel>
          </div>
        </Sample>
      </Section>

      <Section
        id="mewprimitivas"
        kicker="Mewgenics"
        title="Búsqueda · datos · filtros"
        lead={
          <>
            Las tres primitivas genéricas del kit adoptan la piel de papel dentro del ámbito del Codex: <code>&lt;SearchInput&gt;</code>, <code>&lt;ChipGroup&gt;</code> y <code>&lt;DataList&gt;</code>. <em>(La reskin de papel de las primitivas queda aplazada — aquí se muestran en su piel Señal.)</em>
          </>
        }
      >
        <Sample title="SearchInput" code="<SearchInput value onChange size />" col note="Envuelve un &lt;input&gt; nativo; el botón de limpiar aparece solo con texto.">
          <div className="grid w-full max-w-[420px] gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar objeto…" />
            <SearchInput value={q} onChange={setQ} placeholder="Compacto…" size="sm" />
          </div>
        </Sample>
        <Sample title="DataList" code="<DataList rows />" col>
          <div className="w-full max-w-[460px] pt-3">
            <MewPanel title="Ficha" icon="database">
              <DataList
                rows={[
                  { label: "Tipo", value: <MewKind kind="head" /> },
                  { label: "Rareza", value: <MewRarity rarity="common" /> },
                  { label: "Escudo", value: 4 },
                  { label: "ID", value: "SkullCap", mono: true },
                ]}
              />
            </MewPanel>
          </div>
        </Sample>
        <Sample title="ChipGroup" code="<ChipGroup label value onChange options multi />" col note="Radio (una opción) o <code>multi</code> (varias); cada opción admite <code>count</code> y <code>color</code>.">
          <div className="grid w-full max-w-[460px] gap-3.5">
            <ChipGroup label="Tipo" value={kind} onChange={(v) => setKind(v as string)} options={[{ value: "weapon", label: "Arma", count: 258 }, { value: "head", label: "Cabeza", count: 210 }, { value: "face", label: "Cara", count: 199 }, { value: "neck", label: "Cuello", count: 191 }]} />
            <ChipGroup
              label="Rareza (multi)"
              value={rars}
              onChange={(v) => setRars(v as string[])}
              multi
              options={[
                { value: "common", label: "Común", color: "hsl(220 70% 60%)" },
                { value: "uncommon", label: "Poco común", color: "hsl(150 70% 60%)" },
                { value: "rare", label: "Raro", color: "hsl(210 70% 60%)" },
                { value: "very_rare", label: "Muy raro", color: "hsl(285 70% 60%)" },
              ]}
            />
          </div>
        </Sample>
      </Section>

      <Section
        id="mewatoms"
        kicker="Mewgenics"
        title="Tesela y rareza"
        lead={<>Sin arte del juego, cada entidad se identifica con una <strong>tesela-globo</strong> de papel teñido por su hue, monograma en tipografía de rotulador y el glifo de su categoría. Rareza, facción y tipo son pegatinas con contorno entintado del mismo hue.</>}
      >
        <Sample title="MewTile" code="<MewTile cat rec size />" note="Radio orgánico y degradado de papel. El monograma toma las iniciales del nombre.">
          <MewTile cat="items" rec={ITEM} size={64} />
          <MewTile cat="characters" rec={CHAR} size={64} />
          <MewTile cat="passives" rec={{ id: "Barbed", name: "Barbed" }} size={64} />
          <MewTile cat="events" rec={{ id: "TrashBin", name: "Trash Bin" }} size={64} />
          <MewTile cat="maps" rec={{ id: "alley", name: "The Alley" }} size={64} />
        </Sample>
        <Sample title="Rareza" code="<MewRarity rarity />">
          <MewRarity rarity="common" />
          <MewRarity rarity="uncommon" />
          <MewRarity rarity="rare" />
          <MewRarity rarity="very_rare" />
        </Sample>
        <Sample title="Facción y tipo de objeto" code="<MewFaction faction> · <MewKind kind>">
          <MewFaction faction="enemies" />
          <MewFaction faction="allies" />
          <MewFaction faction="birds" />
          <MewKind kind="weapon" />
          <MewKind kind="trinket" />
        </Sample>
        <Sample title="Texto con tokens" code="<MewText> · [img:x] · {ph}" col note="Tokens <code>[img:...]</code> como píldoras rojas de rotulador, saltos de línea y marcadores de acumulación.">
          <div className="w-full max-w-[480px] pt-3">
            <MewPanel title="Descripción" icon="book">
              <MewText>{TEXT}</MewText>
            </MewPanel>
          </div>
        </Sample>
      </Section>

      <Section
        id="meweffects"
        kicker="Mewgenics"
        title="Efectos y estadísticas"
        lead={<>El renderizador genérico <code>&lt;MewEffects&gt;</code> convierte cualquier mapa de pasivas en filas legibles. <code>&lt;MewStats&gt;</code> dibuja las estadísticas felinas como barras de cera con contorno entintado y línea base en 5.</>}
      >
        <Sample title="MewEffects" code="<MewEffects map onNav />" col note="Valores: número (+N en rojo), id de entidad, lista o subobjeto.">
          <div className="w-full max-w-[480px] pt-3">
            <MewPanel title="Pasivas que otorga" icon="shield" count={4}>
              <MewEffects map={EFFECTS} />
            </MewPanel>
          </div>
        </Sample>
        <Sample title="MewStats" code="<MewStats stats />" col note="Verde por encima de la línea base, ámbar por debajo, rojo en la media.">
          <div className="w-full max-w-[380px] pt-3">
            <MewPanel title="Estadísticas" icon="chart">
              <MewStats stats={STATS} />
            </MewPanel>
          </div>
        </Sample>
        <Sample title="Referencias" code="<MewRef id cat onNav />">
          <MewRef id="Rat" label="Lil' Rat" icon="paw" />
          <MewRef id="SkullCap" label="Skull Cap" icon="sword" />
        </Sample>
      </Section>

      <Section
        id="mewpopover"
        kicker="Mewgenics"
        title="Ficha al vuelo"
        lead={<>Toda referencia a una <strong>habilidad, pasiva o estado</strong> — y también a <strong>objetos y conjuntos</strong> — despliega una ficha-resumen de papel al pasar el cursor. <code>&lt;MewHoverCard&gt;</code> se posiciona bajo la referencia y compone coste, alcance, daño y efectos según la categoría.</>}
      >
        <Sample title="MewHoverCard · sobre una referencia" code="<MewHoverCard cat rec><MewRef/></MewHoverCard>" note="Pasa el cursor por encima de cada píldora para ver su ficha. La aparición se retrasa ~90&nbsp;ms.">
          <div className="flex flex-wrap gap-1.5">
            <MewHoverCard cat="abilities" rec={ABILITY}>
              <MewRefLink icon="bolt">{ABILITY.name}</MewRefLink>
            </MewHoverCard>
            <MewHoverCard cat="passives" rec={PASSIVE}>
              <MewRefLink icon="shield">{PASSIVE.name}</MewRefLink>
            </MewHoverCard>
            <MewHoverCard cat="keywords" rec={KEYWORD}>
              <MewRefLink icon="flame">{KEYWORD.name}</MewRefLink>
            </MewHoverCard>
          </div>
        </Sample>
        <Sample title="MewPopCard · contenido de la ficha" code="<MewPopCard cat rec />" col note="El cuerpo se adapta a la categoría: habilidad (coste · alcance · daño · efectos), pasiva (clase · rangos · efecto base) y estado (regla).">
          <div className="flex flex-wrap gap-[22px] pt-1.5">
            <div className="w-[300px]">
              <MewPopCard cat="abilities" rec={ABILITY} />
            </div>
            <div className="w-[300px]">
              <MewPopCard cat="passives" rec={PASSIVE} />
            </div>
            <div className="w-[300px]">
              <MewPopCard cat="keywords" rec={KEYWORD} />
            </div>
          </div>
        </Sample>
        <Sample title="Objeto y conjunto · al vuelo" code={`<MewHoverCard cat="items"|"sets" />`} note="Los objetos resumen tipo, rareza, escudo y pasivas; los <strong>conjuntos</strong> derivan sus piezas de los objetos con el mismo <code>set</code>.">
          <div className="flex flex-wrap gap-1.5">
            <MewHoverCard cat="items" rec={ITEM_D}>
              <MewRefLink icon="sword">{ITEM_D.name}</MewRefLink>
            </MewHoverCard>
            <MewHoverCard cat="items" rec={ITEM2}>
              <MewRefLink icon="sword">{ITEM2.name}</MewRefLink>
            </MewHoverCard>
            <MewHoverCard cat="sets" rec={SET}>
              <MewSetTag>{SET.name}</MewSetTag>
            </MewHoverCard>
          </div>
        </Sample>
        <Sample title="MewPopCard · objeto y conjunto" code={`<MewPopCard cat="items"|"sets" />`} col>
          <div className="flex flex-wrap gap-[22px] pt-1.5">
            <div className="w-[300px]">
              <MewPopCard cat="items" rec={ITEM_D} />
            </div>
            <div className="w-[300px]">
              <MewPopCard cat="sets" rec={SET} />
            </div>
          </div>
        </Sample>
      </Section>
    </div>
  )
}
