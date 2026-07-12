"use client"

import { useTranslations } from "next-intl"
import { Banner, Empty } from "@/components/boffmedia/primitives"
import { StatsData, Skill, Weapon } from "@/types/tools/mhwilds"
import { getAllWeaponElements } from "./equipment-utils"
import {
  MhPanel, MhStat3, MhElement, MhResistances, MhSharpness, MhSkillRow, MhCatLegend, MhLabel,
} from "../../../_components/ui/mh-kit"
import { weaponAttack } from "../../../_components/mh-helpers"
import { ForgePanel } from "./ForgePanel"

export function Summary({
  stats, skills, skillsData, weapon,
}: {
  stats: StatsData; skills: Skill[]; skillsData: Record<string, any>; weapon: Weapon | null
}) {
  const t = useTranslations("mhwilds")
  const catLabels = { attack: t("build_planner.cat_attack"), element: t("element"), defense: t("defense"), utility: t("build_planner.cat_utility") }
  const wasted = skills.filter((s) => s.level > s.maxLevel).reduce((n, s) => n + (s.level - s.maxLevel), 0)
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
  const { elements, statuses } = weapon ? getAllWeaponElements(weapon) : { elements: [], statuses: [] }
  const primary = elements[0] || statuses[0] || null

  return (
    <div className="flex flex-col gap-3.5">
      {/* weapon */}
      <MhPanel title={t("weapon")} icon="sword" aside={weapon ? undefined : undefined}>
        {!weapon ? (
          <Empty icon="sword" title={t("build_planner.no_weapon")} lead={t("build_planner.no_weapon_lead")} />
        ) : (
          <>
            <div className="font-display text-[15px] leading-tight font-bold uppercase tracking-[0.02em] mb-0.5 not-italic">{weapon.name}</div>
            <div className="font-mono text-[11px] leading-none text-txt-muted mb-3">{t(`weapons.${weapon.kind}`)}</div>
            <MhStat3 items={[
              { value: weaponAttack(weapon), label: t("attack"), mod: "attack" },
              { value: `${weapon.affinity >= 0 ? "+" : ""}${weapon.affinity}%`, label: t("affinity"), color: weapon.affinity >= 0 ? "var(--ok)" : "var(--bad)" },
              { value: (weapon.slots || []).filter((x) => x > 0).length || 0, label: t("build_planner.slots") },
            ]} />
            {primary && <div className="mt-3"><MhElement type={primary.type} value={primary.damage} hidden={primary.hidden} label={t(primary.type)} /></div>}
            {weapon.sharpness && (
              <div className="mt-3.5">
                <MhLabel>{t("build_planner.sharpness")}</MhLabel>
                <MhSharpness sharpness={weapon.sharpness as any} />
              </div>
            )}
          </>
        )}
      </MhPanel>

      {/* defense */}
      <MhPanel title={t("defense")} icon="shield">
        <div className="flex items-end gap-3.5 mb-3">
          <div>
            <div className="font-display text-[34px] leading-none italic font-extrabold text-[var(--info)]">{stats.defenseMin}</div>
            <MhLabel className="mt-1.5 mb-0">{t("build_planner.base_defense")}</MhLabel>
          </div>
        </div>
        <MhLabel>{t("build_planner.elemental_resistances")}</MhLabel>
        <MhResistances
          res={{ fire: stats.fireRes, water: stats.waterRes, thunder: stats.thunderRes, ice: stats.iceRes, dragon: stats.dragonRes }}
          labelFor={(k) => t(k)}
        />
      </MhPanel>

      {/* skills */}
      <MhPanel title={t("build_planner.active_skills")} icon="bolt" count={skills.length}>
        {skills.length === 0 ? (
          <Empty icon="bolt" title={t("build_planner.no_active_skills")} lead={t("build_planner.no_active_skills_description")} />
        ) : (
          <>
            {wasted > 0 && (
              <Banner tone="warn" title={t("build_planner.overallocated_skills")}>
                {t("build_planner.wasted_points", { count: wasted })}
              </Banner>
            )}
            <div className={`flex flex-col gap-1.5 ${wasted > 0 ? "mt-2.5" : ""}`}>
              {sortedSkills.map((s) => (
                <MhSkillRow
                  key={s.name}
                  name={s.name}
                  level={s.level}
                  maxLevel={s.maxLevel || 1}
                  kind={skillsData[String(s.id)]?.kind || s.kind}
                  desc={s.description}
                />
              ))}
            </div>
            <div className="mt-3"><MhCatLegend labels={catLabels} /></div>
          </>
        )}
      </MhPanel>

      {/* forge materials — cumulative full upgrade path (equipped weapon) */}
      {weapon && <ForgePanel weapon={weapon} />}
    </div>
  )
}
