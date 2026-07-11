"use client"

import { Icon, type IconName } from "@/components/boffmedia/primitives"
import { MewText, MewPanel } from "../../MewAtoms"
import { mewHuman, type MewEventOption } from "../../mew-util"
import { MewEffectVal, MewFlag, type NavFn } from "../MewRefs"
import { MewCol, MewDesc, MewDetail, MewHero, type ViewProps } from "./scaffold"

const MEW_REWARD_LABEL: Record<string, string> = {
  get_item_from_pool: "Objeto de reserva", get_item: "Objeto", get_parasite: "Parásito",
  party_heal: "Cura al grupo", gain_food: "Comida", gain_gold: "Oro", lose_gold: "Pierde oro",
  self_status_next_fight: "Estado propio (próx. combate)", ally_ambush_next_fights: "Emboscada aliada",
  spawn_unit_next_fight: "Invoca unidad", gain_disorder_from_pool: "Trastorno",
  random_pool: "Recompensa aleatoria", set_flag: "Activa bandera", heal: "Cura",
  gain_xp: "Experiencia", add_cat: "Añade gato", remove_cat: "Pierde gato",
}
function mewRewardLabel(k: string) { return MEW_REWARD_LABEL[k] || mewHuman(k) }
const MEW_STAT_ABBR: Record<string, string> = { str: "FUE", dex: "DES", con: "CON", int: "INT", spd: "VEL", cha: "CAR", lck: "SUE" }

function MewReward({ entry, onNav }: { entry: Record<string, unknown>; onNav: NavFn }) {
  const effects = Object.entries(entry).filter(([k]) => k !== "prompt")
  const prompt = typeof entry.prompt === "string" ? entry.prompt : ""
  if (!prompt && !effects.length) return null
  return (
    <div className="flex flex-col gap-1 border-t border-dashed border-[color:var(--mwp-ink-line)] pt-1.5 first:border-t-0 first:pt-0">
      {prompt ? <div className="mb-[3px]"><MewText muted>{prompt}</MewText></div> : null}
      {effects.map(([k, v]) => (
        <div className="flex items-baseline justify-between gap-2.5" key={k}>
          <span className="text-[11.5px]/[1.3] font-medium text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{mewRewardLabel(k)}</span>
          <span className="flex flex-wrap justify-end gap-1 font-mono text-[12px]/[1.3] text-[color:var(--mwp-ink)]">
            {typeof v === "boolean" ? (v ? "Sí" : "No") : <MewEffectVal v={v} onNav={onNav} />}
          </span>
        </div>
      ))}
    </div>
  )
}

function MewOutcome({ outcome, tone, tag, icon, onNav }: { outcome?: MewEventOption["good"]; tone?: "good" | "bad"; tag: string; icon: IconName; onNav: NavFn }) {
  if (!outcome || !outcome.entries.length) return null
  const toneCls = tone === "good" ? "bg-[#e4eed6] [&_.otag]:text-[color:var(--mwp-good)]" : tone === "bad" ? "bg-[#f6d9d3] [&_.otag]:text-[color:var(--mwp-bad)]" : "bg-[color:var(--mwp-paper)]"
  return (
    <div className={"flex flex-col gap-2 border-l-2 border-dashed border-[color:var(--mwp-ink-line)] px-3.5 py-3 first:border-l-0 max-[900px]:border-l-0 max-[900px]:border-t-2 " + toneCls}>
      <span className="otag inline-flex items-center gap-1.5 text-[10.5px]/none uppercase tracking-[0.08em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)] [&_svg]:text-current">
        <Icon name={icon} size={12} />{tag}
      </span>
      {outcome.entries.map((e, i) => <MewReward key={i} entry={e} onNav={onNav} />)}
    </div>
  )
}

export function EventView({ rec, onNav }: ViewProps) {
  const options = rec.options || []
  return (
    <MewDetail>
      <MewHero cat="events" rec={rec} badges={rec.subject ? <MewFlag icon="eye">{mewHuman(rec.subject)}</MewFlag> : undefined} />
      <MewDesc>{rec.prompt}</MewDesc>
      <MewCol single>
        <MewPanel title="Elecciones" icon="compass" count={options.length}>
          <div className="flex flex-col gap-3.5">
            {options.map((o) => (
              <div className="overflow-hidden border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-2)] [border-radius:var(--wob-c)]" key={o.id}>
                <div className="flex items-center justify-between gap-2.5 border-b-2 border-dashed border-[color:var(--mwp-ink-line)] px-3.5 pb-2 pt-[11px]">
                  <span className="text-[16px]/none text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)]">{o.label}</span>
                  {o.stat && <span className="text-[11.5px]/none font-semibold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">Chequeo <b className="text-[color:var(--mwp-red-deep)]">{MEW_STAT_ABBR[o.stat] || mewHuman(o.stat)}</b></span>}
                </div>
                <div className="grid grid-cols-2 max-[900px]:grid-cols-1">
                  <MewOutcome outcome={o.good} tone="good" tag="Éxito" icon="check" onNav={onNav} />
                  <MewOutcome outcome={o.bad} tone="bad" tag="Fallo" icon="x" onNav={onNav} />
                  <MewOutcome outcome={o.flat} tag="Resultado" icon="arrow" onNav={onNav} />
                </div>
              </div>
            ))}
          </div>
        </MewPanel>
      </MewCol>
    </MewDetail>
  )
}
