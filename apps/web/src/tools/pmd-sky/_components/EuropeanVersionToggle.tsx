"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface EuropeanVersionToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function EuropeanVersionToggle({
  checked,
  onChange,
}: EuropeanVersionToggleProps) {
  const t = useTranslations("");

  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left rounded-xl transition-all duration-300 focus:outline-none"
      style={{
        background: checked
          ? "linear-gradient(135deg, rgba(6,182,212,0.07) 0%, rgba(2,6,23,0.85) 100%)"
          : "linear-gradient(135deg, rgba(15,23,42,0.7) 0%, rgba(2,6,23,0.85) 100%)",
        border: checked
          ? "1px solid rgba(6,182,212,0.35)"
          : "1px solid rgba(71,85,105,0.25)",
        boxShadow: checked ? "0 0 20px rgba(6,182,212,0.08)" : "none",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3.5 gap-4">
        {/* Left: icon + labels */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Accent dot */}
          <span
            className="w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-300"
            style={{ background: checked ? "rgba(34,211,238,0.7)" : "rgba(100,116,139,0.4)" }}
          />

          {/* EU flag */}
          <span className="text-base flex-shrink-0 leading-none">🇪🇺</span>

          {/* Label + description */}
          <div className="min-w-0">
            <div
              className="text-[10px] uppercase tracking-[0.25em] transition-colors duration-300"
              style={{
                fontFamily: "Orbitron, sans-serif",
                color: checked ? "rgba(165,243,252,0.85)" : "rgba(148,163,184,0.7)",
              }}
            >
              {t("EUROPEAN_VERSION")}
            </div>
            <div
              className="text-[10px] font-mono tracking-wide mt-0.5 transition-colors duration-300"
              style={{ color: checked ? "rgba(34,211,238,0.5)" : "rgba(100,116,139,0.55)" }}
            >
              {checked ? "Formato EU activado" : "Formato internacional"}
            </div>
          </div>
        </div>

        {/* Right: toggle switch */}
        <div
          className="relative flex-shrink-0 rounded-full transition-all duration-300"
          style={{
            width: 44,
            height: 24,
            background: checked
              ? "linear-gradient(90deg, rgba(6,182,212,0.6), rgba(34,211,238,0.5))"
              : "rgba(30,41,59,0.8)",
            border: checked
              ? "1px solid rgba(34,211,238,0.5)"
              : "1px solid rgba(71,85,105,0.4)",
            boxShadow: checked ? "0 0 10px rgba(6,182,212,0.3), inset 0 0 6px rgba(34,211,238,0.1)" : "none",
          }}
        >
          <motion.div
            className="absolute top-0.5 rounded-full"
            style={{
              width: 18,
              height: 18,
              background: checked ? "rgb(224,242,254)" : "rgba(100,116,139,0.7)",
              boxShadow: checked ? "0 0 6px rgba(34,211,238,0.6)" : "none",
            }}
            animate={{ x: checked ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        </div>
      </div>
    </motion.button>
  );
}
