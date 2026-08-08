"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function ItemsTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  // Watch fields to compute greying state
  const fieldItemsMod = useWatch({
    control: form.control,
    name: "fieldItemsMod",
  })
  const shopItemsMod = useWatch({
    control: form.control,
    name: "shopItemsMod",
  })
  const pickupItemsMod = useWatch({
    control: form.control,
    name: "pickupItemsMod",
  })

  return (
    <div className="space-y-5">
      {/* Panel 1: Field Items */}
      <AvPanel
        title={t("panels.fieldItems")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="fieldItemsMod"
            titleKey="panels.fieldItemsMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.fieldItemsMod.UNCHANGED" },
              { value: "SHUFFLE", i18nKey: "opt.fieldItemsMod.SHUFFLE" },
              { value: "RANDOM", i18nKey: "opt.fieldItemsMod.RANDOM" },
              { value: "RANDOM_EVEN", i18nKey: "opt.fieldItemsMod.RANDOM_EVEN" },
            ]}
          />

          <ToggleRow
            field="banBadRandomFieldItems"
            labelKey="opt.banBadRandomFieldItems.label"
            tipKey="opt.banBadRandomFieldItems.tip"
            disabled={fieldItemsMod === "UNCHANGED" || fieldItemsMod === "SHUFFLE"}
          />
        </div>
      </AvPanel>

      {/* Panel 2: Special Shop Items */}
      <AvPanel
        title={t("panels.specialShopItems")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="shopItemsMod"
            titleKey="panels.specialShopItemsMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.shopItemsMod.UNCHANGED" },
              { value: "SHUFFLE", i18nKey: "opt.shopItemsMod.SHUFFLE" },
              { value: "RANDOM", i18nKey: "opt.shopItemsMod.RANDOM" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="banBadRandomShopItems"
              labelKey="opt.banBadRandomShopItems.label"
              tipKey="opt.banBadRandomShopItems.tip"
              disabled={shopItemsMod !== "RANDOM"}
            />
            <ToggleRow
              field="banRegularShopItems"
              labelKey="opt.banRegularShopItems.label"
              tipKey="opt.banRegularShopItems.tip"
              disabled={shopItemsMod !== "RANDOM"}
            />
            <ToggleRow
              field="guaranteeEvolutionItems"
              labelKey="opt.guaranteeEvolutionItems.label"
              tipKey="opt.guaranteeEvolutionItems.tip"
              disabled={shopItemsMod !== "RANDOM"}
            />
            <ToggleRow
              field="guaranteeXItems"
              labelKey="opt.guaranteeXItems.label"
              tipKey="opt.guaranteeXItems.tip"
              disabled={shopItemsMod !== "RANDOM"}
            />
            <ToggleRow
              field="banOPShopItems"
              labelKey="opt.banOPShopItems.label"
              tipKey="opt.banOPShopItems.tip"
              disabled={shopItemsMod !== "RANDOM"}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 3: Shop Items */}
      <AvPanel
        title={t("panels.shopItems")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <ToggleRow
            field="balanceShopPrices"
            labelKey="opt.balanceShopPrices.label"
            tipKey="opt.balanceShopPrices.tip"
          />
          <ToggleRow
            field="addCheapRareCandiesToShops"
            labelKey="opt.addCheapRareCandiesToShops.label"
            tipKey="opt.addCheapRareCandiesToShops.tip"
          />
        </div>
      </AvPanel>

      {/* Panel 4: Pickup Items */}
      <AvPanel
        title={t("panels.pickupItems")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="pickupItemsMod"
            titleKey="panels.pickupItemsMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.pickupItemsMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.pickupItemsMod.RANDOM" },
            ]}
          />

          <ToggleRow
            field="banBadRandomPickupItems"
            labelKey="opt.banBadRandomPickupItems.label"
            tipKey="opt.banBadRandomPickupItems.tip"
            disabled={pickupItemsMod !== "RANDOM"}
          />
        </div>
      </AvPanel>
    </div>
  )
}
