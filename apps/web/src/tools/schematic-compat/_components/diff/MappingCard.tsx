"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/boffmedia/primitives";
import { AssetThumb, type SchRing, type ThumbRenderer } from "@/components/boffmedia/ui/schematic";
import { STATUS_META, TONE, type SchDiffEntry } from "../ui/sch-tokens";
import { ReplaceSelect } from "./ReplaceSelect";

/** Verbose mapping row: source → target thumb, states, and the replace control. */
export function MappingCard({
  entry,
  options,
  resolution,
  onResolve,
  selected,
  onSelect,
  renderThumb,
}: {
  entry: SchDiffEntry;
  options: string[];
  resolution?: string;
  onResolve: (blockId: string, target: string) => void;
  selected?: boolean;
  onSelect?: () => void;
  renderThumb?: ThumbRenderer;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const meta = STATUS_META[entry.status];
  const tone = TONE[meta.tone];
  const auto = entry.autoCandidate;
  const effective = resolution || auto;
  const replaceable = entry.status !== "safe";
  const isModOnly = entry.status === "mod-only";
  const stateKeys = Object.keys(entry.block.states || {});
  const thumb = (id: string, size: number, ring?: SchRing) => renderThumb?.(id, size, ring) ?? <AssetThumb id={id} size={size} ring={ring} />;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect?.())}
      style={{ borderLeftColor: tone.cssVar }}
      className={cn(
        "p-2.5 border border-solid border-l-[3px] cursor-pointer transition-[background,border-color] duration-[140ms]",
        selected ? "border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent-line)]" : "border-line bg-panel hover:bg-panel-2",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          {thumb(entry.block.id, 42, meta.ring)}
          {effective ? (
            <div className="flex items-center gap-1.5 self-center shrink-0 text-txt-dim">
              <Icon name="arrow" size={16} />
              {thumb(effective, 34)}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tone.dot)} />
              <span className="font-mono text-[12px] text-txt truncate">{entry.block.id}</span>
              {isModOnly ? (
                <span className="shrink-0 py-[1px] px-1.5 font-mono text-[9px] font-bold tracking-[0.08em] uppercase bg-bad-soft text-bad border border-solid border-[color-mix(in_srgb,var(--bad)_35%,transparent)]">
                  mod
                </span>
              ) : null}
            </div>
            {effective ? (
              <div className={cn("font-mono text-[11px] pl-[13px] mt-0.5 truncate", resolution ? "text-accent-bright" : "text-[color:color-mix(in_srgb,var(--ok)_85%,var(--text))]")}>
                → {effective}
                {resolution ? " · " + t("diff.manual") : ""}
              </div>
            ) : null}
            <div className="pl-[13px] mt-[3px] text-[11px] text-txt-dim">{t("diff.instances", { count: entry.instanceCount })}</div>
            {stateKeys.length > 0 ? (
              <div className="flex flex-wrap gap-[5px] pl-[13px] mt-[7px]">
                {stateKeys.map((k) => {
                  const bad = entry.incompatibleStates?.includes(k);
                  return (
                    <span key={k} className={cn("py-[2px] px-1.5 font-mono text-[10px]", bad ? "bg-bad-soft text-bad" : "bg-panel-2 text-txt-muted")}>
                      {k}={String(entry.block.states?.[k])}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {replaceable ? (
          <div className="flex items-center gap-2 pl-[13px]" onClick={(e) => e.stopPropagation()}>
            <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-txt-dim shrink-0">{t("diff.replace")}</span>
            <ReplaceSelect fluid value={resolution} placeholder={auto || t("diff.choose")} options={options} onChange={(v) => onResolve(entry.block.id, v)} renderThumb={renderThumb} />
            {resolution ? (
              <button
                type="button"
                onClick={() => onResolve(entry.block.id, "")}
                className="bg-transparent border-0 text-txt-dim font-mono text-[10px] cursor-pointer underline underline-offset-2 shrink-0 hover:text-txt-muted"
              >
                {auto ? t("diff.auto") : t("diff.clear")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
