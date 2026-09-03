"use client";

import { useEffect, useState } from "react";
import { useToolT } from "../../../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Button, Icon } from "@boffmedia/ui";
import { AssetThumb } from "../../../ui";
import { POP_SHADOW, type BulkAction, type BulkNsGroup } from "../ui/sch-tokens";

/** Drawer that resolves every missing block of a namespace in one pass. */
export function BulkRulesSheet({
  open,
  groups,
  onClose,
  onApply,
}: {
  open: boolean;
  groups: BulkNsGroup[];
  onClose: () => void;
  onApply: (actions: Record<string, BulkAction>) => void;
}) {
  const t = useToolT("tools.schematicCompat");
  const acts: [BulkAction, string][] = [
    ["skip", t("diff.bulkAction.skip")],
    ["remap", t("diff.bulkAction.remap")],
    ["air", t("diff.bulkAction.air")],
  ];
  const [actions, setActions] = useState<Record<string, BulkAction>>({});
  useEffect(() => {
    if (!open) setActions({});
  }, [open]);
  if (!open) return null;
  const set = (ns: string, a: BulkAction) => setActions((p) => ({ ...p, [ns]: a }));
  const canApply = Object.values(actions).some((a) => a && a !== "skip");

  return (
    <div className="fixed inset-0 z-[950] flex justify-end bg-scrim" onClick={onClose}>
      <aside
        className={cn("relative w-[min(27.5rem,100%)] h-full flex flex-col bg-panel border-l-2 border-accent", POP_SHADOW, "animate-[bm-drawer-in_0.24s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("diff.bulkRulesTitle")}
      >
        <header className="relative py-[1.125rem] px-[1.125rem] border-b border-line">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("diff.close")}
            className="absolute top-3.5 right-3.5 bg-transparent border-0 text-txt-dim cursor-pointer p-1 hover:text-txt"
          >
            <Icon name="x" size={16} />
          </button>
          <span className="font-mono text-[0.625rem] tracking-[0.14em] uppercase text-accent-bright">{t("diff.bulkRules")}</span>
          <h3 className="font-display italic font-extrabold text-[1.5rem] my-[0.3125rem] text-txt not-italic">{t("diff.bulkRulesTitle")}</h3>
          <p className="text-[0.8125rem] text-txt-muted m-0 max-w-[40ch]">{t("diff.bulkRulesDesc")}</p>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto py-3.5 px-[1.125rem] flex flex-col gap-2.5">
          {groups.map((g) => {
            const a = actions[g.namespace] || "skip";
            const would = a === "air" ? g.entries.length : a === "remap" ? g.remap : 0;
            return (
              <div key={g.namespace} className="border border-line bg-base-2 p-[0.6875rem]">
                <div className="flex items-center justify-between gap-2 mb-[0.5625rem]">
                  <span className="flex items-center gap-2">
                    <AssetThumb id={g.namespace + ":block"} size={20} />
                    <span className="font-mono text-[0.8125rem] font-semibold text-txt">{g.namespace}</span>
                    <span className="font-mono text-[0.625rem] py-px px-1.5 bg-panel-2 text-txt-muted">{g.entries.length}</span>
                  </span>
                  {a !== "skip" && would > 0 ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[0.65625rem] text-ok">
                      <Icon name="check" size={11} />
                      {t("diff.bulkWouldResolve", { count: would })}
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {acts.map(([k, lbl]) => {
                    const disabled = k === "remap" && g.remap === 0;
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={disabled}
                        onClick={() => set(g.namespace, k)}
                        className={cn(
                          "py-[0.4375rem] px-1 font-mono text-[0.6875rem] border border-solid cursor-pointer transition-[color,border-color,background] duration-[140ms]",
                          "disabled:opacity-40 disabled:cursor-not-allowed",
                          a === k ? "border-accent bg-accent-soft text-accent-bright" : "border-line text-txt-muted enabled:hover:border-line-2 enabled:hover:text-txt",
                        )}
                      >
                        {lbl}
                        {k === "remap" && g.remap > 0 ? ` (${g.remap})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="shrink-0 flex items-center justify-end gap-2.5 py-3 px-[1.125rem] border-t border-line">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("diff.bulkCancel")}
          </Button>
          <Button variant="pri" size="sm" icon="check" disabled={!canApply} onClick={() => onApply(actions)}>
            {t("diff.bulkApply")}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
