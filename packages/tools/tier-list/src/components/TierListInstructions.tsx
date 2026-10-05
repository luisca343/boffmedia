"use client"

import { Disclosure, Icon } from "@boffmedia/ui"
import { useTierListT } from "../i18n"

/** Shared guidance for embedded boards, the editor and the workspace. */
export function TierListInstructions({ mode, hasFixedItems }: { mode: "exclusive" | "multi"; hasFixedItems: boolean }) {
  const t = useTierListT()
  return <div className="grid gap-2">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-txt-muted">
      <p>{t(mode === "multi" ? "multiHint" : "exclusiveHint")}</p>
      {hasFixedItems && <p className="flex items-center gap-1.5 text-xs"><Icon name="lock" size={14} />{t("lockedItems")}</p>}
    </div>
    <Disclosure title={t("interactionHelp")} icon="info">
      <div className="grid gap-2 pt-3 text-sm text-txt-muted">
        <p>{t("dragHint")}</p><p>{t("dragInstructions")}</p>
        {hasFixedItems && <p>{t("fixedItemsHint")}</p>}
      </div>
    </Disclosure>
  </div>
}
