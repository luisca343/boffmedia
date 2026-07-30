"use client";

import { useTranslations } from "next-intl";
import { BlockThumb, SelectionLocateControls } from "@/components/boffmedia/ui/schematic";
import { useSelectionFocus } from "@/lib/schematic/actions";
import { selectEnvironment, useViewerStore } from "../_store/viewer.store";

/** Details for the selected block: texture, id, blockstates, instance count. */
export function BlockInspector() {
  const t = useTranslations("games.minecraft.schematicViewer");
  const selectedBlockId = useViewerStore((s) => s.selectedBlockId);
  const blockPositions = useViewerStore((s) => s.blockPositions);
  const registry = useViewerStore(selectEnvironment).registry;
  // No diff here — a read-only viewer's total is just the navigable count
  // (RF-08's culled-interiors note never shows).
  const focus = useSelectionFocus(useViewerStore);

  if (!selectedBlockId) {
    return (
      <p className="m-0 text-[12px] leading-[1.5] text-txt-dim">{t("preview.inspectorEmpty")}</p>
    );
  }

  const group = blockPositions.find((g) => g.block.id === selectedBlockId);
  const stateEntries = group ? Object.entries(group.block.states) : [];

  return (
    <div className="flex gap-2.5">
      <BlockThumb
        blockId={selectedBlockId}
        version={registry?.version}
        registryId={registry?.id}
        size={40}
        preview={false}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-2 break-all font-mono text-[12.5px] font-semibold text-txt">
          {selectedBlockId}
        </div>
        {stateEntries.length > 0 && (
          <div className="mb-1.5 grid gap-[3px]">
            {stateEntries.map(([k, v]) => (
              <div key={k} className="flex justify-between font-mono text-[11px]">
                <span className="text-txt-muted">{k}</span>
                <span className="text-txt-dim">{v}</span>
              </div>
            ))}
          </div>
        )}
        <p className="m-0 text-[11.5px] text-txt-dim">
          {t("preview.instances", { count: focus.counts.navigable })}
        </p>
        <SelectionLocateControls
          className="mt-2"
          labels={{
            locate: t("preview.locate"),
            prev: t("preview.prev"),
            next: t("preview.next"),
            isolate: t("preview.isolate"),
            stepper: t("preview.stepper", { index: focus.index + 1, navigable: focus.counts.navigable }),
          }}
          canCycle={focus.canCycle}
          culled={focus.counts.culled}
          isolate={focus.isolate}
          onLocate={focus.locate}
          onNext={focus.next}
          onPrev={focus.prev}
          onToggleIsolate={focus.toggleIsolate}
        />
      </div>
    </div>
  );
}
