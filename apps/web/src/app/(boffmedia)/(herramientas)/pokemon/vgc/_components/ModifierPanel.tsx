"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modifiers, hasModifiers } from "../speedCalc";

interface Props {
  modifiers: Modifiers;
  onChange: (m: Modifiers) => void;
}

const BOOST_STEPS = [-2, -1, 1, 2, 3] as const;

export function ModifierPanel({ modifiers, onChange }: Props) {
  const t = useTranslations("vgc.speed.modifiers");

  const toggleBoost = (n: number) =>
    onChange({ ...modifiers, boost: modifiers.boost === n ? 0 : n });

  const toggleFlag = (key: "tailwind" | "scarf" | "paralysis") =>
    onChange({ ...modifiers, [key]: !modifiers[key] });

  const clear = () => onChange({ boost: 0, tailwind: false, scarf: false, paralysis: false });

  const active = hasModifiers(modifiers);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-lg border border-surface-800 bg-surface-950/60">
      <span className="text-[11px] text-surface-500 font-semibold uppercase tracking-wider shrink-0">
        {t("title")}
      </span>

      {/* Stat stage buttons */}
      <div className="flex items-center gap-1">
        {BOOST_STEPS.map((n) => {
          const isActive = modifiers.boost === n;
          const isPositive = n > 0;
          return (
            <button
              key={n}
              onClick={() => toggleBoost(n)}
              title={t("boostTitle", { n })}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all border ${
                isActive
                  ? isPositive
                    ? "bg-green-500/20 text-green-300 border-green-500/50"
                    : "bg-red-500/20 text-red-300 border-red-500/50"
                  : "bg-surface-800/80 text-surface-400 border-transparent hover:text-surface-200 hover:bg-surface-700/60"
              }`}
            >
              {n > 0 ? `+${n}` : n}
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-surface-700/60 hidden sm:block" />

      {/* Flag toggles */}
      {(
        [
          { key: "tailwind"  as const, label: t("tailwindShort"),  title: t("tailwind"),  activeClass: "bg-blue-500/20 text-blue-300 border-blue-500/50"       },
          { key: "scarf"     as const, label: t("scarfShort"),     title: t("scarf"),     activeClass: "bg-orange-500/20 text-orange-300 border-orange-500/50" },
          { key: "paralysis" as const, label: t("paralysisShort"), title: t("paralysis"), activeClass: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50" },
        ]
      ).map(({ key, label, title, activeClass }) => (
        <button
          key={key}
          onClick={() => toggleFlag(key)}
          title={title}
          className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all border ${
            modifiers[key]
              ? activeClass
              : "bg-surface-800/80 text-surface-400 border-transparent hover:text-surface-200 hover:bg-surface-700/60"
          }`}
        >
          {label}
        </button>
      ))}

      {active && (
        <>
          <div className="h-4 w-px bg-surface-700/60 hidden sm:block" />
          <button
            onClick={clear}
            title={t("clear")}
            className="p-1 rounded text-surface-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
