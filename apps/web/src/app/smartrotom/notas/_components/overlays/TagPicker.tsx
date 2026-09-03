"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { NoteTag } from "@boffmedia/shared";
import { Icon } from "../ui";
import { ThemedLayer } from "../ui/ThemedLayer";
import { rgbOf, colorKey } from "../../_utils/colors";

export function TagPicker({
  tags,
  current,
  x,
  y,
  onClose,
  onToggle,
  onCreate,
}: {
  tags: NoteTag[];
  current: number[];
  x: number;
  y: number;
  onClose: () => void;
  onToggle: (tagId: number) => void;
  onCreate: (label: string) => void;
}) {
  const t = useTranslations("notas");
  const [q, setQ] = useState("");
  const filtered = tags.filter((t) => t.label.toLowerCase().includes(q.toLowerCase()));
  const canCreate = q.trim() && !tags.some((t) => t.label.toLowerCase() === q.trim().toLowerCase());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <ThemedLayer>
      <div className="fixed inset-0 z-[300]" onMouseDown={onClose}>
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute w-[15rem] overflow-hidden rounded-nt-md border border-nt-border-2 bg-nt-panel shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]"
          style={{ left: Math.min(x, window.innerWidth - 250), top: Math.min(y, window.innerHeight - 300) }}
        >
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) {
                onCreate(q.trim());
                setQ("");
              }
            }}
            placeholder={t("tagPicker.placeholder")}
            className="w-full border-b border-nt-border bg-transparent px-3 py-2.5 text-[0.8125rem] text-nt-fg outline-none placeholder:text-nt-fg-subtle"
          />
          <div className="nt-scroll max-h-[13.75rem] overflow-auto p-1.5">
            {filtered.map((t) => {
              const on = current.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => onToggle(t.id)}
                  className="flex cursor-pointer items-center gap-2 rounded-nt-sm px-2 py-2 text-[0.8125rem] text-nt-fg-muted hover:bg-nt-hover hover:text-nt-fg"
                >
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: `rgb(${rgbOf(colorKey(t.color))})` }}
                  />
                  <span className="flex-1 truncate">{t.label}</span>
                  {on && <Icon name="check" size={14} className="text-nt-accent-fg" />}
                </div>
              );
            })}
            {canCreate && (
              <div
                onClick={() => {
                  onCreate(q.trim());
                  setQ("");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-nt-sm px-2 py-2 text-[0.8125rem] text-nt-accent-fg hover:bg-nt-hover"
              >
                <Icon name="plus" size={14} />
                {t("tagPicker.create", { name: q.trim() })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemedLayer>,
    document.body,
  );
}
