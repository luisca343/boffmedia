"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/boffmedia/primitives";
import type { SchStatus } from "../ui/sch-tokens";
import { useToolStore } from "../../_store/tool.store";
import { convertedPlan, resultPlan } from "./previewPlan";

/** Maps an engine status to its `diff.*` translation key (mirrors DiffPanel). */
const STATUS_KEY: Record<SchStatus, string> = {
  safe: "diff.safe",
  renamed: "diff.renamed",
  "state-changed": "diff.stateChanged",
  missing: "diff.missing",
  "mod-only": "diff.modOnly",
};

/**
 * Details for the selected block. The id/state rows are plain document data; the
 * "converts to" row and the status line only exist once a diff does.
 */
export function Inspector() {
  const t = useTranslations("games.minecraft.schematicCompat");
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const resolutions = useToolStore((s) => s.resolutions);
  const previewMode = useToolStore((s) => s.previewMode);

  if (!selectedBlockId) {
    return <p className="text-[12px] text-txt-dim leading-[1.5] m-0">{t("preview.inspectorEmpty")}</p>;
  }

  const group = blockPositions.find((g) => g.block.id === selectedBlockId);
  const block = group?.block;
  const diffEntry = diff?.entries.find((e) => e.block.id === selectedBlockId);
  const stateEntries = block ? Object.entries(block.states) : [];

  // In converted/result mode, surface the block this is being converted into.
  const plan =
    (previewMode === "converted" || previewMode === "result") && diff
      ? previewMode === "converted"
        ? convertedPlan(selectedBlockId, diffEntry?.status, diffEntry?.autoCandidate?.id, resolutions[selectedBlockId]?.targetId)
        : resultPlan(selectedBlockId, diffEntry?.status, diffEntry?.autoCandidate?.id, resolutions[selectedBlockId]?.targetId)
      : null;
  const convertsTo = plan && plan.textureId !== selectedBlockId ? plan.textureId : null;

  return (
    <>
      <div className="font-mono text-[12.5px] font-semibold text-txt mb-2 break-all">{selectedBlockId}</div>
      {convertsTo && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] mb-2 break-all">
          <Icon name="arrow" size={13} className="shrink-0 text-accent-bright" />
          <span className="text-accent-bright">{convertsTo}</span>
        </div>
      )}
      {stateEntries.length > 0 && (
        <div className="grid gap-[3px] mb-1.5">
          {stateEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between font-mono text-[11px]">
              <span className="text-txt-muted">{k}</span>
              <span className="text-txt-dim">{v}</span>
            </div>
          ))}
        </div>
      )}
      {diffEntry && (
        <p className="text-[11.5px] text-txt-dim m-0">
          {t("diff.instances", { count: diffEntry.instanceCount })} ·{" "}
          <span className="capitalize font-semibold text-txt-muted">{t(STATUS_KEY[diffEntry.status])}</span>
        </p>
      )}
    </>
  );
}
