"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Toggle } from "@boffmedia/ui"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "../_components/controls/InfoTooltip"

/**
 * Misc. Tweaks are packed into a single int, `currentMiscTweaks` — each checkbox
 * is one bit. Masks are the AUTHORITATIVE values from FVX's own
 * `com/uprfvx/romio/MiscTweak` (decompiled from the pinned fvx.jar), mapped by
 * NAME → mask. Note FVX assigns bit 256 to FAST_EGG_HATCHING which has no GUI
 * checkbox, so a positional mapping would silently bit-slip every tweak after
 * it — hence the explicit masks below. Only `currentMiscTweaks` is a form field;
 * the individual toggles are derived (never registered).
 */
const MISC_TWEAKS: { mask: number; key: string }[] = [
  { mask: 1, key: "miscBWExpPatch" },
  { mask: 2, key: "miscNerfXAccuracy" },
  { mask: 4, key: "miscFixCritRate" },
  { mask: 8, key: "miscFastestText" },
  { mask: 16, key: "miscRunningShoesIndoors" },
  { mask: 32, key: "miscRandomizePCPotion" },
  { mask: 64, key: "miscAllowPikachuEvolution" },
  { mask: 128, key: "miscGiveNationalDexAt" },
  { mask: 512, key: "miscForceChallengeMode" },
  { mask: 1024, key: "miscLowerCasePokemonNames" },
  { mask: 2048, key: "miscRandomizeCatchingTutorial" },
  { mask: 4096, key: "miscBanLuckyEgg" },
  { mask: 8192, key: "miscNoFreeLuckyEgg" },
  { mask: 16384, key: "miscBanBigMoneyManiac" },
  { mask: 32768, key: "miscSOSBattles" },
  { mask: 65536, key: "miscBalanceStaticLevels" },
  { mask: 131072, key: "miscRetainAltFormes" },
  { mask: 262144, key: "miscRunWithoutRunningShoes" },
  { mask: 524288, key: "miscFasterHPAndEXPBars" },
  { mask: 1048576, key: "miscFastDistortionWorld" },
  { mask: 2097152, key: "miscUpdateRotomFormeTyping" },
  { mask: 4194304, key: "miscDisableLowHPMusic" },
]

export default function MiscTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  const tweaks = useWatch({ control: form.control, name: "currentMiscTweaks" }) ?? 0

  const setBit = (mask: number, on: boolean) => {
    const next = on ? tweaks | mask : tweaks & ~mask
    form.setValue("currentMiscTweaks", next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-5">
      <AvPanel
        title={t("panels.miscTweaks")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MISC_TWEAKS.map(({ mask, key }) => (
            <div key={key} className="flex items-center gap-3">
              <Toggle
                on={(tweaks & mask) !== 0}
                onChange={(on) => setBit(mask, on)}
                label={t(`opt.${key}.label`)}
              />
              <InfoTooltip tipKey={`opt.${key}.tip`} />
            </div>
          ))}
        </div>
      </AvPanel>
    </div>
  )
}
