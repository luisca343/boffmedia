"use client"

import { Panel, Icon, Toggle, Kbd } from "@boffmedia/ui"
import { SrtNumberStepper } from "@boffmedia/ui/giveaways"
import { useToolT, SORTEOS_NS } from "../i18n"

export interface SorteosSettingsProps {
  winners: number
  maxWinners: number
  weighted: boolean
  exclude: boolean
  sound: boolean
  onWinnersChange: (n: number) => void
  onWeightedChange: (v: boolean) => void
  onExcludeChange: (v: boolean) => void
  onSoundChange: (v: boolean) => void
}

/**
 * Settings component — draw configuration panel
 */
export function SorteosSettings({
  winners,
  maxWinners,
  weighted,
  exclude,
  sound,
  onWinnersChange,
  onWeightedChange,
  onExcludeChange,
  onSoundChange,
}: SorteosSettingsProps) {
  const t = useToolT(SORTEOS_NS)

  return (
    <Panel title={t("configTitle")} media={<Icon name="sliders" />} bodyClassName="p-0">
      <div className="grid gap-[14px] p-[20px]">
        {/* Winners */}
        <div className="flex items-center justify-between gap-[12px]">
          <span className="min-w-0">
            <b className="block font-display text-[12px] font-bold uppercase tracking-[0.05em] text-txt">
              {t("cfgWinners")}
            </b>
            <span className="mt-[4px] block font-mono text-[10px] leading-[1.4] text-txt-dim">
              {t("cfgWinnersSub")}
            </span>
          </span>
          <SrtNumberStepper
            value={winners}
            onChange={onWinnersChange}
            min={1}
            max={maxWinners}
            size="sm"
            lessLabel={t("less")}
            moreLabel={t("more")}
            accent
          />
        </div>

        {/* Weighted */}
        <div className="flex items-center justify-between gap-[12px]">
          <span className="min-w-0">
            <b className="block font-display text-[12px] font-bold uppercase tracking-[0.05em] text-txt">
              {t("cfgWeighted")}
            </b>
            <span className="mt-[4px] block font-mono text-[10px] leading-[1.4] text-txt-dim">
              {t("cfgWeightedSub")}
            </span>
          </span>
          <Toggle on={weighted} onChange={onWeightedChange} ariaLabel={t("cfgWeighted")} />
        </div>

        {/* Exclude */}
        <div className="flex items-center justify-between gap-[12px]">
          <span className="min-w-0">
            <b className="block font-display text-[12px] font-bold uppercase tracking-[0.05em] text-txt">
              {t("cfgExclude")}
            </b>
            <span className="mt-[4px] block font-mono text-[10px] leading-[1.4] text-txt-dim">
              {t("cfgExcludeSub")}
            </span>
          </span>
          <Toggle on={exclude} onChange={onExcludeChange} ariaLabel={t("cfgExclude")} />
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between gap-[12px]">
          <span className="min-w-0">
            <b className="block font-display text-[12px] font-bold uppercase tracking-[0.05em] text-txt">
              {t("cfgSound")}
            </b>
            <span className="mt-[4px] block font-mono text-[10px] leading-[1.4] text-txt-dim">
              {t("cfgSoundSub")}
            </span>
          </span>
          <Toggle on={sound} onChange={onSoundChange} ariaLabel={t("cfgSound")} />
        </div>
      </div>

      {/* Keyboard legend */}
      <div className="hidden [@media(pointer:fine)]:flex flex-col border-t border-line px-[20px] py-[14px] font-mono text-[10px] leading-[1.5] text-txt-dim">
        <div className="flex items-center gap-[6px]">
          <Kbd>{t("kbdSpace")}</Kbd>
          <span>{t("kbdLegendSpace")}</span>
        </div>
        <div className="flex items-center gap-[6px] mt-[8px]">
          <Kbd>Esc</Kbd>
          <span>{t("kbdLegendEsc")}</span>
        </div>
      </div>
    </Panel>
  )
}
