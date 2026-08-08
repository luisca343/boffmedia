"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { SliderRow } from "../_components/controls/SliderRow"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function TmhmTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  // Watch fields to compute greying state
  const tmsMod = useWatch({
    control: form.control,
    name: "tmsMod",
  })
  const tmsForceGoodDamaging = useWatch({
    control: form.control,
    name: "tmsForceGoodDamaging",
  })
  const tmsHmsCompatibilityMod = useWatch({
    control: form.control,
    name: "tmsHmsCompatibilityMod",
  })
  const moveTutorMovesMod = useWatch({
    control: form.control,
    name: "moveTutorMovesMod",
  })
  const tutorsForceGoodDamaging = useWatch({
    control: form.control,
    name: "tutorsForceGoodDamaging",
  })
  const moveTutorsCompatibilityMod = useWatch({
    control: form.control,
    name: "moveTutorsCompatibilityMod",
  })

  return (
    <div className="space-y-5">
      {/* Panel 1: TM Moves */}
      <AvPanel
        title={t("panels.tmMoves")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="tmsMod"
            titleKey="panels.tmMovesMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.tmsMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.tmsMod.RANDOM" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="blockBrokenTMMoves"
              labelKey="opt.blockBrokenTMMoves.label"
              tipKey="opt.blockBrokenTMMoves.tip"
              disabled={tmsMod !== "RANDOM"}
            />
            <ToggleRow
              field="keepFieldMoveTMs"
              labelKey="opt.keepFieldMoveTMs.label"
              tipKey="opt.keepFieldMoveTMs.tip"
              disabled={tmsMod !== "RANDOM"}
            />
            <ToggleRow
              field="tmsForceGoodDamaging"
              labelKey="opt.tmsForceGoodDamaging.label"
              tipKey="opt.tmsForceGoodDamaging.tip"
              disabled={tmsMod !== "RANDOM"}
            />
            <SliderRow
              field="tmsGoodDamagingPercent"
              labelKey="opt.tmsGoodDamagingPercent.label"
              tipKey="opt.tmsGoodDamagingPercent.tip"
              min={0}
              max={100}
              unit="%"
              disabled={tmsMod !== "RANDOM" || !tmsForceGoodDamaging}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 2: TM/HM Compatibility */}
      <AvPanel
        title={t("panels.tmHmCompatibility")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="tmsHmsCompatibilityMod"
            titleKey="panels.tmHmCompatibilityMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.tmsHmsCompatibilityMod.UNCHANGED" },
              { value: "RANDOM_PREFER_TYPE", i18nKey: "opt.tmsHmsCompatibilityMod.RANDOM_PREFER_TYPE" },
              { value: "COMPLETELY_RANDOM", i18nKey: "opt.tmsHmsCompatibilityMod.COMPLETELY_RANDOM" },
              { value: "FULL", i18nKey: "opt.tmsHmsCompatibilityMod.FULL" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="tmsFollowEvolutions"
              labelKey="opt.tmsFollowEvolutions.label"
              tipKey="opt.tmsFollowEvolutions.tip"
              disabled={tmsHmsCompatibilityMod === "UNCHANGED" || tmsHmsCompatibilityMod === "FULL"}
            />
            <ToggleRow
              field="tmLevelUpMoveSanity"
              labelKey="opt.tmLevelUpMoveSanity.label"
              tipKey="opt.tmLevelUpMoveSanity.tip"
            />
            <ToggleRow
              field="fullHMCompat"
              labelKey="opt.fullHMCompat.label"
              tipKey="opt.fullHMCompat.tip"
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 3: Move Tutor Moves */}
      <AvPanel
        title={t("panels.tutorMoves")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="moveTutorMovesMod"
            titleKey="panels.tutorMovesMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.moveTutorMovesMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.moveTutorMovesMod.RANDOM" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="blockBrokenTutorMoves"
              labelKey="opt.blockBrokenTutorMoves.label"
              tipKey="opt.blockBrokenTutorMoves.tip"
              disabled={moveTutorMovesMod !== "RANDOM"}
            />
            <ToggleRow
              field="keepFieldMoveTutors"
              labelKey="opt.keepFieldMoveTutors.label"
              tipKey="opt.keepFieldMoveTutors.tip"
              disabled={moveTutorMovesMod !== "RANDOM"}
            />
            <ToggleRow
              field="tutorsForceGoodDamaging"
              labelKey="opt.tutorsForceGoodDamaging.label"
              tipKey="opt.tutorsForceGoodDamaging.tip"
              disabled={moveTutorMovesMod !== "RANDOM"}
            />
            <SliderRow
              field="tutorsGoodDamagingPercent"
              labelKey="opt.tutorsGoodDamagingPercent.label"
              tipKey="opt.tutorsGoodDamagingPercent.tip"
              min={0}
              max={100}
              unit="%"
              disabled={moveTutorMovesMod !== "RANDOM" || !tutorsForceGoodDamaging}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 4: Move Tutor Compatibility */}
      <AvPanel
        title={t("panels.tutorMovesCompatibility")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="moveTutorsCompatibilityMod"
            titleKey="panels.tutorMovesCompatibilityMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.moveTutorsCompatibilityMod.UNCHANGED" },
              { value: "RANDOM_PREFER_TYPE", i18nKey: "opt.moveTutorsCompatibilityMod.RANDOM_PREFER_TYPE" },
              { value: "COMPLETELY_RANDOM", i18nKey: "opt.moveTutorsCompatibilityMod.COMPLETELY_RANDOM" },
              { value: "FULL", i18nKey: "opt.moveTutorsCompatibilityMod.FULL" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="tutorFollowEvolutions"
              labelKey="opt.tutorFollowEvolutions.label"
              tipKey="opt.tutorFollowEvolutions.tip"
              disabled={moveTutorsCompatibilityMod === "UNCHANGED" || moveTutorsCompatibilityMod === "FULL"}
            />
            <ToggleRow
              field="tutorLevelUpMoveSanity"
              labelKey="opt.tutorLevelUpMoveSanity.label"
              tipKey="opt.tutorLevelUpMoveSanity.tip"
            />
          </AvPanel>
        </div>
      </AvPanel>
    </div>
  )
}
