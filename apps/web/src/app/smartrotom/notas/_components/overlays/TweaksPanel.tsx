"use client";

import { useState } from "react";
import { Icon } from "../ui";
import { useNotesTheme, ACCENT_OPTIONS, type Theme, type Reading, type Width } from "../../_hooks/useNotesTheme";

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12.5px] text-nt-fg-muted">{label}</span>
      <div className="flex gap-0.5 rounded-nt-md border border-nt-border bg-nt-bg-1 p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-nt-sm px-2.5 py-1 text-[12px] transition-colors ${
              value === o.v ? "bg-nt-accent/15 text-nt-accent-fg" : "text-nt-fg-muted hover:text-nt-fg"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const t = useNotesTheme();

  return (
    <div className="fixed bottom-4 left-4 z-[80] max-md:hidden">
      {open && (
        <div className="mb-2 w-[280px] rounded-nt-xl border border-nt-border-2 bg-nt-panel p-3.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]">
          <div className="mb-3 font-nt-display text-[10px] font-semibold uppercase tracking-[.14em] text-nt-fg-subtle">
            Apariencia
          </div>
          <div className="flex flex-col gap-3">
            <Seg<Theme>
              label="Tema"
              value={t.theme}
              options={[
                { v: "dark", l: "Oscuro" },
                { v: "light", l: "Claro" },
              ]}
              onChange={t.setTheme}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-nt-fg-muted">Acento</span>
              <div className="flex gap-1.5">
                {ACCENT_OPTIONS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => t.setAccent(hex)}
                    aria-label={`Acento ${hex}`}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      t.accent === hex ? "border-nt-fg" : "border-transparent"
                    }`}
                    style={{ background: hex }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mb-3 mt-4 font-nt-display text-[10px] font-semibold uppercase tracking-[.14em] text-nt-fg-subtle">
            Lectura
          </div>
          <div className="flex flex-col gap-3">
            <Seg<Reading>
              label="Tipografía"
              value={t.reading}
              options={[
                { v: "sans", l: "Sans" },
                { v: "serif", l: "Serif" },
              ]}
              onChange={t.setReading}
            />
            <Seg<Width>
              label="Ancho"
              value={t.width}
              options={[
                { v: "normal", l: "Normal" },
                { v: "wide", l: "Ancho" },
              ]}
              onChange={t.setWidth}
            />
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ajustes de apariencia"
        className="grid h-10 w-10 place-items-center rounded-full border border-nt-border-2 bg-nt-elevated text-nt-fg-muted shadow-[0_10px_30px_-10px_rgba(0,0,0,.6)] transition-colors hover:text-nt-fg"
      >
        <Icon name="settings" size={18} />
      </button>
    </div>
  );
}
