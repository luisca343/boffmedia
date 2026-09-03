"use client";

import { useToolT } from "../../../i18n";
import { Icon } from "@boffmedia/ui";
import { SelectionLocateControls } from "../../../ui";
import { useSelectionFocus } from "../../../engine/actions";
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
  const t = useToolT("tools.schematicCompat");
  const selectedBlockId = useToolStore((s) => s.selectedBlockId);
  const selectedStructureIdx = useToolStore((s) => s.selectedStructureIdx);
  const blockPositions = useToolStore((s) => s.blockPositions);
  const diff = useToolStore((s) => s.diff);
  const resolutions = useToolStore((s) => s.resolutions);
  const previewMode = useToolStore((s) => s.previewMode);

  const diffEntry = diff?.entries.find((e) => e.block.id === selectedBlockId);
  // RF-08: compat is diff-aware, so the stepper's total is the diff's reported
  // instance count (which may exceed what the worker kept client-side) — a
  // read-only viewer has no diff and falls back to the navigable count itself.
  const focus = useSelectionFocus(useToolStore, diffEntry?.instanceCount);
  const locateLabels = {
    locate: t("preview.locate"),
    prev: t("preview.prev"),
    next: t("preview.next"),
    isolate: t("preview.isolate"),
    stepper: t("preview.stepper", { index: focus.index + 1, navigable: focus.counts.navigable }),
    culledNote: t("preview.culledNote", { total: focus.counts.total }),
  };
  const locateControls = (
    <SelectionLocateControls
      labels={locateLabels}
      canCycle={focus.canCycle}
      culled={focus.counts.culled}
      isolate={focus.isolate}
      onLocate={focus.locate}
      onNext={focus.next}
      onPrev={focus.prev}
      onToggleIsolate={focus.toggleIsolate}
    />
  );

  const hasStructureSelection = !!selectedStructureIdx && selectedStructureIdx.length > 0;
  if (!selectedBlockId && !hasStructureSelection) {
    return <p className="text-[0.75rem] text-txt-dim leading-[1.5] m-0">{t("preview.inspectorEmpty")}</p>;
  }
  // A structure-only selection (no block) shows just the locate/isolate
  // cluster — its own detail (name/type/tile count) renders in StructuresSection.
  if (!selectedBlockId) return locateControls;

  const group = blockPositions.find((g) => g.block.id === selectedBlockId);
  const block = group?.block;
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
      <div className="font-mono text-[0.78125rem] font-semibold text-txt mb-2 break-all">{selectedBlockId}</div>
      {convertsTo && (
        <div className="flex items-center gap-1.5 font-mono text-[0.6875rem] mb-2 break-all">
          <Icon name="arrow" size={13} className="shrink-0 text-accent-bright" />
          <span className="text-accent-bright">{convertsTo}</span>
        </div>
      )}
      {stateEntries.length > 0 && (
        <div className="grid gap-[3px] mb-1.5">
          {stateEntries.map(([k, v]) => (
            <div key={k} className="flex justify-between font-mono text-[0.6875rem]">
              <span className="text-txt-muted">{k}</span>
              <span className="text-txt-dim">{v}</span>
            </div>
          ))}
        </div>
      )}
      {diffEntry && (
        <p className="text-[0.71875rem] text-txt-dim m-0">
          {t("diff.instances", { count: diffEntry.instanceCount })} ·{" "}
          <span className="capitalize font-semibold text-txt-muted">{t(STATUS_KEY[diffEntry.status])}</span>
        </p>
      )}
      <SelectionLocateControls
        className="mt-2"
        labels={locateLabels}
        canCycle={focus.canCycle}
        culled={focus.counts.culled}
        isolate={focus.isolate}
        onLocate={focus.locate}
        onNext={focus.next}
        onPrev={focus.prev}
        onToggleIsolate={focus.toggleIsolate}
      />
    </>
  );
}
