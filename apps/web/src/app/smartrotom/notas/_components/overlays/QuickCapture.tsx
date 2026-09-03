"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Overlay, MODAL_PANEL, Icon, Kbd } from "../ui";

// ⌘⇧N — jot a quick note; first line becomes the title.
export function QuickCapture({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (init: { title: string; content: string }) => void;
}) {
  const t = useTranslations("notas");
  const [text, setText] = useState("");

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return onClose();
    const [first, ...rest] = trimmed.split("\n");
    const body = rest.join("\n").trim();
    const paras = body
      ? body
          .split(/\n+/)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("")
      : "<p><br></p>";
    onSave({ title: first.slice(0, 120), content: `<h1>${escapeHtml(first)}</h1>${paras}` });
    onClose();
  };

  return (
    <Overlay onClose={onClose} align="start">
      <div className={`${MODAL_PANEL} mt-[16vh] w-[33.75rem] max-w-[92vw]`}>
        <div className="flex items-center gap-2.5 border-b border-nt-border px-[1.125rem] py-3.5">
          <Icon name="zap" size={17} className="text-nt-accent-fg" />
          <span className="font-nt-display text-[0.75rem] font-semibold uppercase tracking-[.08em] text-nt-accent-fg">
            {t("capture.title")}
          </span>
        </div>
        <div className="p-[1.125rem]">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
            }}
            placeholder={t("capture.placeholder")}
            className="min-h-[7.5rem] w-full resize-none bg-transparent text-[0.9375rem] leading-[1.6] text-nt-fg outline-none placeholder:text-nt-fg-subtle"
          />
        </div>
        <div className="flex items-center justify-between border-t border-nt-border px-[1.125rem] py-3">
          <span className="text-[0.6875rem] text-nt-fg-subtle">
            <Kbd>⌘</Kbd> <Kbd>↵</Kbd> {t("capture.saveHint")}
          </span>
          <button
            onClick={save}
            className="inline-flex h-9 items-center gap-2 rounded-nt-md bg-gradient-to-b from-nt-500 to-nt-600 px-3.5 text-[0.84375rem] font-[550] text-white hover:brightness-[1.06]"
          >
            <Icon name="plus" size={15} /> {t("capture.save")}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
