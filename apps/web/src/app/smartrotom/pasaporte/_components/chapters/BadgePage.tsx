"use client"

// PAPER. One earned gym badge, and the battle it was taken with.

import { useTranslations } from "next-intl"
import type { UserAchievement } from "@boffmedia/shared"
import { typesOf } from "@/app/smartrotom/pc/_utils/derive"
import { TYPE_LABELS } from "@/app/smartrotom/pokedex/_utils/typeColors"
import { usePokemonStore } from "@/stores/pokemonStore"
import { docDate } from "../../_utils/dates"
import { badgeArt, moveName, parseTeam, sealInk } from "../../_utils/medals"
import { Button, CircuitTag, HoloStamp, Icon, SectionLabel, Sprite, TypePill, WaxSeal } from "../ui"

function shortCircuit(name: string | null | undefined): string {
  return (name ?? "").replace(/^Circuito de\s+/i, "")
}

export function BadgePage({
  achievement,
  slam,
  inspect,
  onReplay,
}: {
  achievement: UserAchievement
  /** True while this leaf is the open one: the seal comes down. */
  slam: boolean
  inspect: boolean
  onReplay: (achievement: UserAchievement) => void
}) {
  const t = useTranslations("pasaporte")
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)
  const team = parseTeam(achievement.team)
  const circuit = shortCircuit(achievement.subcategory)

  return (
    <>
      <div className="flex items-center gap-[18px] border-b-2 border-ps-ink/22 pb-3.5">
        <WaxSeal
          src={badgeArt(achievement.icon)}
          alt={achievement.name}
          earned
          size={78}
          tint={sealInk(achievement.id)}
          slam={slam}
        />
        <div className="min-w-0 flex-1">
          {circuit && <CircuitTag className="mb-[7px]">{circuit}</CircuitTag>}
          <h2 className="font-ps-ceremony text-[clamp(22px,3.4vh,32px)] leading-[1.04]">{achievement.name}</h2>
          <p className="ps-num mt-1.5 flex items-center gap-1.5 font-ps-mono text-[11px] tracking-[.06em] text-ps-ink-faint">
            <Icon name="cal" className="h-3.5 w-3.5" />
            {t("badgePage.obtained", { date: docDate(achievement.completedAt) })}
          </p>
          {achievement.replay && (
            <Button
              onClick={() => onReplay(achievement)}
              className="mt-2 h-auto border-ps-ink bg-ps-ink px-3.5 py-2 text-ps-paper shadow-[0_2px_0_rgba(0,0,0,.3)] hover:border-ps-chapter-deep hover:bg-ps-chapter-deep hover:text-ps-paper focus-visible:ring-ps-chapter focus-visible:ring-offset-ps-paper"
            >
              <Icon name="play" className="h-3.5 w-3.5" />
              {t("badgePage.watchReplay")}
            </Button>
          )}
        </div>
      </div>

      <p className="my-3 text-[12px] text-ps-ink-soft">{achievement.description}</p>

      {team.length > 0 && (
        <>
          <SectionLabel className="text-[13px]" count={t("badgePage.teamCount", { count: team.length })}>
            {t("badgePage.team")}
          </SectionLabel>
          <ul className="flex-1">
            {team.slice(0, 6).map((mon, i) => {
              const types = typesOf(mon, speciesByDex).map((t) => TYPE_LABELS[t] ?? t)
              const moves = (mon.moves ?? [])
                .map(moveName)
                .filter((m): m is string => !!m)
                .slice(0, 2)

              return (
                <li
                  key={`${mon.dex}-${i}`}
                  className="flex items-center gap-2 border-b border-dashed border-ps-ink/22 py-1.5 last:border-b-0"
                >
                  <Sprite dex={mon.dex} form={mon.form} palette={mon.palette} name={mon.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-ps-ceremony text-[13px]">
                      {mon.name || mon.species}{" "}
                      <span className="ps-num font-ps-mono text-[9px] text-ps-ink-faint">
                        {t("common.level", { level: mon.level })}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {types.map((typeName, ti) => (
                        <TypePill key={`${ti}-${typeName}`} type={typeName} className="px-[5px] py-px text-[8px]" />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-none gap-1.5 font-ps-mono text-[10px] text-ps-ink-soft">
                    {moves.map((move, mi) => (
                      <span key={`${mi}-${move}`}>{move}</span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <HoloStamp show={inspect} className="top-[30%]">
        {t("badgePage.seal.line1")}
        <br />
        {t("badgePage.seal.line2")}
      </HoloStamp>
    </>
  )
}
