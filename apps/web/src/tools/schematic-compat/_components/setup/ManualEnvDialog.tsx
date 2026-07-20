"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon } from "@/components/boffmedia/primitives";
import { cn } from "@/lib/utils";
import { BUNDLED_VERSIONS, DEFAULT_VANILLA_VERSION } from "@/lib/schematic/versions";
import type { ModLoader } from "@/lib/schematic/registry/loader-detect";

export interface ManualEnvChoice {
  version: string;
  modLoader?: ModLoader;
}

const LOADERS: readonly (ModLoader | "none")[] = ["none", "forge", "neoforge", "fabric"];

/**
 * Shown when a picked folder carries no launcher metadata we recognise. Asking
 * for the version + loader directly is what turns "unsupported launcher" into a
 * one-question detour — the mod JARs already collected are still scanned, so the
 * resulting environment is identical to a detected one.
 */
export function ManualEnvDialog({
  open,
  jarCount,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  jarCount: number;
  onConfirm: (choice: ManualEnvChoice) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const [version, setVersion] = useState<string>(DEFAULT_VANILLA_VERSION);
  const [loader, setLoader] = useState<ModLoader | "none">("none");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc cancels, as it would in any modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-6 bg-[color-mix(in_srgb,var(--bg)_72%,transparent)]"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("manualEnv.title")}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] grid gap-4 p-5 bg-panel border border-line outline-none"
      >
        <div className="flex items-start gap-2.5">
          <Icon name="info" size={18} className="shrink-0 mt-px text-accent-bright" />
          <div className="grid gap-1.5">
            <h2 className="m-0 font-display font-bold text-[15px] text-txt">{t("manualEnv.title")}</h2>
            <p className="m-0 text-[12.5px] leading-[1.5] text-txt-muted">{t("manualEnv.body")}</p>
            <p className="m-0 font-mono text-[11px] text-txt-dim">
              {t("manualEnv.jarsFound", { count: jarCount })}
            </p>
          </div>
        </div>

        <label className="grid gap-1">
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-txt-dim">
            {t("manualEnv.version")}
          </span>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full p-[9px] bg-base border border-solid border-line-2 font-mono text-[12.5px] text-txt cursor-pointer hover:border-accent-line transition-[border-color] duration-[140ms]"
          >
            {BUNDLED_VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-1">
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-txt-dim">
            {t("manualEnv.loader")}
          </span>
          <div className="inline-flex gap-0.5 p-0.5 border border-line bg-base">
            {LOADERS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={loader === l}
                onClick={() => setLoader(l)}
                className={cn(
                  "flex-1 py-1 px-[7px] font-mono text-[10.5px] cursor-pointer transition-colors duration-[140ms]",
                  loader === l
                    ? "bg-panel-2 text-txt shadow-[inset_0_0_0_1px_var(--line-2)]"
                    : "text-txt-dim hover:text-txt-muted",
                )}
              >
                {l === "none" ? t("manualEnv.loaderNone") : l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-0.5">
          <Button variant="ghost" onClick={onCancel}>
            {t("manualEnv.cancel")}
          </Button>
          <Button
            variant="pri"
            onClick={() => onConfirm({ version, modLoader: loader === "none" ? undefined : loader })}
          >
            {t("manualEnv.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
