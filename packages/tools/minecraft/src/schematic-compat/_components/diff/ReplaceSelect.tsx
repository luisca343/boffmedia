"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToolT } from "../../../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Icon } from "@boffmedia/ui";
import { AssetThumb, type ThumbRenderer } from "../../../ui";
import { POP_SHADOW } from "../ui/sch-tokens";

/** Cap on rendered popover results — `options` can be a target registry with thousands of blocks. */
const MAX_RESULTS = 60;

interface PopPos {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

/** Searchable block combobox; the popover is fixed so it escapes list overflow. */
export function ReplaceSelect({
  value,
  placeholder,
  options,
  onChange,
  renderThumb,
  fluid,
}: {
  value?: string;
  placeholder?: string;
  options: string[];
  onChange: (value: string) => void;
  renderThumb?: ThumbRenderer;
  fluid?: boolean;
}) {
  const t = useToolT("tools.schematicCompat");
  const thumb = (id: string, size: number) => renderThumb?.(id, size) ?? <AssetThumb id={id} size={size} />;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<PopPos | null>(null);
  const trigRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => o.toLowerCase().includes(s)) : options;
  }, [q, options]);
  const visible = filtered.length > MAX_RESULTS ? filtered.slice(0, MAX_RESULTS) : filtered;
  const truncatedCount = filtered.length - visible.length;

  function place() {
    const el = trigRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(Math.max(r.width, 520), window.innerWidth - 16);
    const openUp = window.innerHeight - r.bottom < 420;
    setPos({
      left: Math.min(r.left, window.innerWidth - w - 8),
      width: w,
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
    });
  }
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    place();
    setQ("");
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (trigRef.current && !trigRef.current.contains(el) && !el.closest(".sch-cmb-pop")) setOpen(false);
    };
    const onScroll = (e: Event) => {
      const el = e.target as Node;
      if (el instanceof Element && el.closest(".sch-cmb-pop")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className={cn("relative", fluid ? "min-w-0 flex-1" : "w-[10.5rem] shrink-0")} ref={trigRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "w-full h-[1.875rem] flex items-center gap-1.5 px-2 bg-base border border-solid cursor-pointer transition-[border-color] duration-[140ms]",
          open ? "border-accent-line" : "border-line hover:border-accent-line",
        )}
      >
        {value ? thumb(value, 18) : null}
        <span className={cn("flex-1 min-w-0 font-mono text-[0.6875rem] text-left truncate", value ? "text-txt" : "text-txt-dim")}>
          {value || placeholder}
        </span>
        <Icon
          name="chevronDown"
          size={13}
          className="text-txt-dim shrink-0 transition-transform duration-[140ms]"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && pos ? (
        <div
          className={cn("sch-cmb-pop fixed z-[900] flex flex-col max-h-[26.25rem] overflow-hidden bg-panel border border-line-2", POP_SHADOW)}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 py-2 px-2.5 border-b border-line text-txt-dim shrink-0">
            <Icon name="search" size={13} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("diff.searchPlaceholder")}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-txt font-mono text-[0.75rem] placeholder:text-txt-dim"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5">
            {visible.length === 0 ? (
              <div className="p-4 text-center text-txt-dim text-[0.75rem]">{t("diff.noResults")}</div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(5.75rem,1fr))] gap-1.5">
                {visible.map((o) => {
                  const name = o.includes(":") ? o.slice(o.indexOf(":") + 1) : o;
                  const sel = o === value;
                  return (
                    <button
                      key={o}
                      type="button"
                      title={o}
                      onClick={() => {
                        onChange(o);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex flex-col items-center gap-1 py-2 px-1 border border-solid cursor-pointer",
                        "font-mono text-[0.625rem] leading-tight text-center transition-[background,border-color,color] duration-[140ms]",
                        sel ? "border-accent-line bg-accent-soft text-accent-bright" : "border-transparent text-txt-muted hover:bg-panel-2 hover:text-txt",
                      )}
                    >
                      {thumb(o, 48)}
                      <span className="w-full truncate">{name}</span>
                      {sel ? <Icon name="check" size={12} className="absolute top-1 right-1 text-accent-bright" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {truncatedCount > 0 ? (
            <div className="shrink-0 p-2 text-center font-mono text-[0.65625rem] text-txt-dim border-0 border-t border-line">
              {t("diff.refineSearch", { count: truncatedCount })}
            </div>
          ) : null}
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="shrink-0 p-2 border-0 border-t border-line bg-transparent text-txt-dim font-mono text-[0.65625rem] cursor-pointer transition-colors hover:text-bad"
            >
              {t("diff.clearSelection")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
