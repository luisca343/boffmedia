"use client"

// PAPER. One earned gym badge, and the battle it was taken with.

import { useLocale, useTranslations } from "next-intl"
import type { UserAchievement } from "@boffmedia/shared"
import { typesOf } from "@/app/smartrotom/pc/_utils/derive"
import { TYPE_LABELS } from "@/app/smartrotom/pokedex/_utils/typeColors"
import { usePokemonStore } from "@/stores/pokemonStore"
import { usePassportStore } from "../../_stores/usePassportStore"
import { docDate } from "../../_utils/dates"
import { badgeArt, moveName, parseTeam, sealInk } from "../../_utils/medals"
import { Button, CircuitTag, HoloStamp, Icon, SectionLabel, Sprite, TypePill, WaxSeal } from "../ui"

function shortCircuit(name: string | null | undefined): string {
  return (name ?? "").replace(/^Circuito de\s+/i, "")
}

export function BadgePage({
  achievement,
  index,
  onReplay,
}: {
  achievement: UserAchievement
  /** This leaf's position in the book — the seal comes down when it is the open one. */
  index: number
  onReplay: (achievement: UserAchievement) => void
}) {
  const t = useTranslations("pasaporte")
  const locale = useLocale()
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)
  // The open page and the lamp are read here, not passed down — see the note in `Identidad`.
  const slam = usePassportStore((s) => s.page === index && s.motion === "on")
  const inspect = usePassportStore((s) => s.inspect)
  const team = parseTeam(achievement.team)
  const circuit = shortCircuit(achievement.subcategory)

  return (
    <>
      <div className="flex items-center gap-[1.125rem] border-b-2 border-ps-ink/22 pb-3.5">
        <WaxSeal
          src={badgeArt(achievement.icon)}
          alt={achievement.name}
          earned
          size={78}
          tint={sealInk(achievement.id)}
          slam={slam}
        />
        <div className="min-w-0 flex-1">
          {circuit && <CircuitTag className="mb-[0.4375rem]">{circuit}</CircuitTag>}
          <h2 className="font-ps-ceremony text-[clamp(1.375rem,3.4vh,2rem)] leading-[1.04]">{achievement.name}</h2>
          <p className="ps-num mt-1.5 flex items-center gap-1.5 font-ps-mono text-[0.6875rem] tracking-[.06em] text-ps-ink-faint">
            <Icon name="cal" className="h-3.5 w-3.5" />
            {t("badgePage.obtained", { date: docDate(achievement.completedAt, locale) })}
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

      <p className="my-3 text-[0.75rem] text-ps-ink-soft">{achievement.description}</p>

      {team.length > 0 && (
        <>
          <SectionLabel className="text-[0.8125rem]" count={t("badgePage.teamCount", { count: team.length })}>
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
                    <div className="truncate font-ps-ceremony text-[0.8125rem]">
                      {mon.name || mon.species}{" "}
                      <span className="ps-num font-ps-mono text-[0.5625rem] text-ps-ink-faint">
                        {t("common.level", { level: mon.level })}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {types.map((typeName, ti) => (
                        <TypePill key={`${ti}-${typeName}`} type={typeName} className="px-[0.3125rem] py-px text-[0.5rem]" />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-none gap-1.5 font-ps-mono text-[0.625rem] text-ps-ink-soft">
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
