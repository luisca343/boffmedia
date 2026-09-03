"use client"

import { Sample, Section } from "../showcase-shared"
import {
  TcgCardFace,
  TcgOddsTable,
  TcgPackTile,
  TcgRarityMarks,
  TcgRing,
  TcgSetProgress,
  TcgStatTile,
  TcgTypePip,
} from "@boffmedia/tools-pokemon"
import { DEMO_CARDS, DEMO_ODDS } from "./tcgpocket-demo"

const TYPES: [string, string][] = [
  ["grass", "Planta"], ["fire", "Fuego"], ["water", "Agua"], ["lightning", "Rayo"], ["psychic", "Psíquico"],
  ["fighting", "Lucha"], ["darkness", "Oscuridad"], ["metal", "Metal"], ["dragon", "Dragón"], ["colorless", "Incoloro"],
]
const RARITIES = ["One Diamond", "Two Diamond", "Three Diamond", "Four Diamond", "One Star", "Two Star", "Crown"]

export function TcgPocketChapter() {
  return (
    <>
      <Section
        id="tgcarta"
        kicker="TCG Pocket"
        title="Cara de carta y rejilla"
        lead={<><code>TcgCardFace</code> dibuja la carta por completo: banda de tipo, PS, ventana ilustrada, pips de energía y marcas de rareza. Estados: poseída, faltante (desaturada), <code>ex</code> y editable (±). El pip de energía (<code>TcgTypePip</code>) y las marcas de rareza (<code>TcgRarityMarks</code>) son sus átomos.</>}
      >
        <Sample title="Estados de la carta" code="<TcgCardFace card count editable dim />">
          <div className="grid grid-cols-[repeat(4,8.125rem)] gap-[0.875rem]">
            <TcgCardFace card={DEMO_CARDS[0]} count={2} />
            <TcgCardFace card={DEMO_CARDS[1]} count={1} />
            <TcgCardFace card={DEMO_CARDS[2]} count={0} dim />
            <TcgCardFace card={DEMO_CARDS[3]} count={1} editable />
          </div>
        </Sample>
        <Sample title="Pips de tipo y marcas de rareza" code="<TcgTypePip> · <TcgRarityMarks>" col>
          <div className="mb-[0.875rem] flex flex-wrap gap-[0.625rem]">
            {TYPES.map(([k, label]) => (
              <span key={k} className="inline-flex flex-col items-center gap-[0.3125rem]">
                <TcgTypePip type={k} size={30} title={label} />
                <small className="font-mono text-[0.625rem]/none text-txt-dim">{label}</small>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-[1.125rem]">
            {RARITIES.map((r) => (
              <span key={r} className="inline-flex items-center gap-[0.375rem]">
                <TcgRarityMarks rarity={r} size={12} />
              </span>
            ))}
          </div>
        </Sample>
      </Section>

      <Section
        id="tgdatos"
        kicker="TCG Pocket"
        title="Progreso, anillo y estadísticas"
        lead={<><code>TcgSetProgress</code> es la barra de completado por expansión; <code>TcgRing</code> el anillo del panel; <code>TcgStatTile</code> la baldosa de métrica con acento lateral.</>}
      >
        <Sample title="Progreso por expansión" code="<TcgSetProgress have total />" col>
          <div className="grid w-full max-w-[32.5rem] gap-[0.875rem]">
            <TcgSetProgress label="Choque Genético" sub="A1" have={186} total={286} />
            <TcgSetProgress label="Isla Fabulosa" sub="A1a" have={64} total={86} />
            <TcgSetProgress label="Luz Triunfal" sub="A2b" have={12} total={96} />
          </div>
        </Sample>
        <Sample title="Anillo y baldosas" code="<TcgRing pct> · <TcgStatTile>">
          <TcgRing pct={62} size={120}>
            <b className="font-display text-[1.375rem] not-italic">62%</b>
            <small className="font-mono text-[0.625rem] text-txt-dim">Colección</small>
          </TcgRing>
          <div className="grid min-w-[16.25rem] flex-1 grid-cols-2 gap-3">
            <TcgStatTile icon="cards" label="Poseídas" value={128} sub="de 320" />
            <TcgStatTile icon="trophy" label="Coronas" value={3} hue="var(--accent)" />
          </div>
        </Sample>
      </Section>

      <Section
        id="tgsobres"
        kicker="TCG Pocket"
        title="Sobre y tabla de probabilidades"
        lead={<><code>TcgPackTile</code> es el sobre (booster) con brillo de lámina; <code>TcgOddsTable</code> muestra la probabilidad de carta nueva por hueco — la fila destacada es el mejor sobre para la colección actual.</>}
      >
        <Sample title="Sobres" code="<TcgPackTile setId name meta hue />">
          <div className="grid grid-cols-[repeat(3,8.125rem)] gap-4">
            <TcgPackTile setId="A1" name="Choque Genético" meta="Charizard" hue="hsl(18 90% 55%)" onOpen={() => {}} />
            <TcgPackTile setId="A1a" name="Isla Fabulosa" meta="Mew" hue="hsl(320 70% 62%)" onOpen={() => {}} />
            <TcgPackTile setId="A2" name="Choque Espacio-Tiempo" meta="Dialga" hue="hsl(200 80% 55%)" onOpen={() => {}} />
          </div>
        </Sample>
        <Sample title="Tabla de probabilidades" code="<TcgOddsTable rows />" col>
          <div className="w-full">
            <TcgOddsTable
              rows={DEMO_ODDS}
              slotLabels={["1.ª", "2.ª", "3.ª", "4.ª", "5.ª"]}
              aggLabel="≥1 nueva"
              packLabel="Sobre"
              bestLabel="Mejor"
            />
          </div>
        </Sample>
      </Section>
    </>
  )
}
