"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { cn } from '@boffmedia/ui'
import { MewPanel, MewKind, MewRarity, MewTile } from "../../MewAtoms"
import { select } from "../../mew-store"
import { MEW_STATMOD, mewHuman, mewStatModLabel, mewSubItemName, type MewRec } from "../../mew-util"
import { MewEffects, MewFlag, MewRefList } from "../MewRefs"
import { MewAbilityInline } from "./inline"
import { MewSourceChip } from "./SourcePop"
import { MewDesc, MewDetail, MewFacts, MewFlags, MewHero, MewMoreTag, MewSections, MewSubLabel, MewTag, mewTruncate, num, rows, type ViewProps } from "./scaffold"

/** Pool ids carry engine flags (`general_!autorarity`); `!x` is a switch, not a
 *  word, so drop it rather than printing it at the reader. */
function mewPoolLabel(id: string): string {
  const clean = String(id).split("_").filter((w) => !w.startsWith("!")).join("_")
  return mewHuman(clean || id)
}

export function ItemView({ rec, onNav }: ViewProps) {
  const t = useToolT(MEWGENICS_NS)
  const statRows = Object.keys(MEW_STATMOD)
    .filter((k) => rec[k] != null)
    .map((k) => ({ label: mewStatModLabel(t, k), value: (num(rec, k)! > 0 ? "+" : "") + rec[k] }))
  const usersAll = React.useMemo(() => select.charactersUsingItem(rec.id), [rec.id])
  const { list: users, more: usersMore } = mewTruncate(usersAll, 12)
  const sources = select.itemSources2(rec.id)
  const poolRecs = sources.pools || []
  const shopRecs = sources.shops || []
  const flags: React.ReactNode[] = []
  if (rec.consumable) flags.push(<MewFlag key="c" icon="drop" tone="warn">{t("label.consumable")}</MewFlag>)
  if (rec.cursed) flags.push(<MewFlag key="k" icon="skull" tone="bad">{t("label.cursed")}</MewFlag>)
  if (rec.parasite) flags.push(<MewFlag key="p" icon="bolt" tone="bad">{t("label.parasite")}</MewFlag>)
  if (rec.quest_item) flags.push(<MewFlag key="q" icon="bookmark">{t("label.questItem")}</MewFlag>)
  if (rec.indestructible) flags.push(<MewFlag key="i" icon="shield">{t("label.indestructible")}</MewFlag>)
  if (rec.divine_shield) flags.push(<MewFlag key="d" icon="shield" tone="good">{t("label.divineShield")}</MewFlag>)
  const sets = Array.isArray(rec.set) ? rec.set : rec.set ? [rec.set] : []
  const passN = rec.passives ? Object.keys(rec.passives).length : 0

  return (
    <MewDetail id={rec.id}>
      <MewHero cat="items" rec={rec} badges={<>{rec.kind && <MewKind kind={rec.kind} />}{rec.rarity && <MewRarity rarity={rec.rarity} />}</>} />
      <MewDesc>{rec.desc}</MewDesc>
      {flags.length > 0 && <MewFlags>{flags}</MewFlags>}
      <MewSections>
        {statRows.length > 0 && (
          <MewPanel title={t("panel.mods")} icon="sliders"><MewFacts rows={statRows} /></MewPanel>
        )}
        {passN > 0 && (
          <MewPanel title={t("panel.passivesGranted")} icon="shield" count={passN}>
            <MewEffects map={rec.passives} onNav={onNav} />
          </MewPanel>
        )}
        {(rec.ability || rec.attack) && (
          <MewPanel title={t("panel.use")} icon="bolt">
            <div className="flex flex-col">
              {rec.ability && <MewAbilityInline id={rec.ability} onNav={onNav} label={mewSubItemName(select.name(rec.ability), rec.name)} />}
              {rec.attack && <MewAbilityInline id={rec.attack} onNav={onNav} />}
            </div>
          </MewPanel>
        )}
        {(poolRecs.length > 0 || shopRecs.length > 0) && (
          <MewPanel title={t("panel.whereToGet")} icon="map" span="full">
            <div className="flex flex-col gap-3.5 text-[13px]">
              <p className="m-0 text-[11.5px]/[1.4] italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("source.hint")}</p>
              {poolRecs.length > 0 && (
                <div>
                  <MewSubLabel n={poolRecs.length}>{t("panel.itemPools")}</MewSubLabel>
                  <div className="flex flex-wrap gap-2">
                    {poolRecs.map((p) => (
                      <MewSourceChip
                        key={p.id}
                        label={mewPoolLabel(p.id)}
                        icon="layers"
                        ids={Array.isArray(p.items) ? (p.items as string[]) : []}
                        count={Array.isArray(p.items) ? p.items.length : 0}
                        currentId={rec.id}
                        onNav={onNav}
                      />
                    ))}
                  </div>
                </div>
              )}
              {shopRecs.length > 0 && (
                <div>
                  <MewSubLabel n={shopRecs.length}>{t("panel.shops")}</MewSubLabel>
                  <div className="flex flex-wrap gap-2">
                    {shopRecs.map((sh) => {
                      const stock = select.shopStock(sh.id)
                      return (
                        <MewSourceChip
                          key={sh.id}
                          label={sh.name || mewHuman(sh.id)}
                          icon="gift"
                          ids={stock}
                          count={stock.length}
                          currentId={rec.id}
                          onNav={onNav}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </MewPanel>
        )}
        <MewPanel title={t("panel.data")} icon="database">
          <MewFacts
            rows={rows([
              { label: t("label.type"), value: rec.kind ? <MewKind kind={rec.kind} /> : "—" },
              { label: t("label.rarity"), value: rec.rarity ? <MewRarity rarity={rec.rarity} /> : "—" },
              rec.shield != null && { label: t("label.shield"), value: rec.shield },
              rec.durability != null && { label: t("label.durability"), value: rec.durability },
            ])}
          />
        </MewPanel>
        {sets.length > 0 && (
          <MewPanel title={t("panel.sets")} icon="layers" count={sets.length} span="full">
            <div className="flex flex-col gap-4">
              {sets.map((s) => {
                const set = select.set(s)
                const members = set.members || []
                return (
                  <div key={s}>
                    <MewSubLabel n={members.length}>{mewHuman(s)}</MewSubLabel>
                    <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(88px,1fr))]">
                      {members.map((member) => {
                        const item = select.get("items", member.id)
                        const isCurrentItem = member.id === rec.id
                        return item ? (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => onNav("items", member.id)}
                            className={cn(
                              "relative flex flex-col items-center gap-1 border-2 border-solid p-1.5",
                              isCurrentItem
                                ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-paper-good-light)]"
                                : "border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)]",
                              "text-center cursor-pointer hover:shadow-md transition-all [border-radius:var(--wob-b)]",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
                            )}
                          >
                            <MewTile cat="items" rec={item} size={56} frame="slot" />
                            <span className="text-[10px]/[1.1] font-semibold max-w-[70px] text-[color:var(--mwp-ink)]">{item.name}</span>
                            {isCurrentItem && <span className="absolute top-0 right-0 text-[10px] font-bold bg-[color:var(--mwp-red)] text-white px-1 py-0.5 [border-radius:0_2px_0_4px]">★</span>}
                          </button>
                        ) : null
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </MewPanel>
        )}
        {Array.isArray(rec.global_tags) && rec.global_tags.length > 0 && (
          <MewPanel title={t("panel.tags")} icon="bookmark">
            <div className="flex flex-wrap gap-1.5">{rec.global_tags.map((t) => <MewTag key={t}>{mewHuman(t)}</MewTag>)}</div>
          </MewPanel>
        )}
        {users.length > 0 && (
          <MewPanel title={t("panel.carriers")} icon="paw" count={usersAll.length} span="full">
            <div className="flex flex-wrap gap-1.5">
              <MewRefList ids={users.map((u) => u.id)} cat="characters" icon="paw" onNav={onNav} />
              {usersMore > 0 && <MewMoreTag n={usersMore} />}
            </div>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}
