"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HiMail, HiCheckCircle, HiClipboardCopy } from "react-icons/hi";
import { useTranslations } from "next-intl";
import { useScanAnimation } from "@/hooks/tools/useScanAnimation";

interface WonderMailDisplayProps {
  mail: string;
  isEuropean: boolean;
  onCopy: () => void;
  copied: boolean;
}

const CORNER_BRACKETS = [
  "absolute top-3 left-3 w-5 h-5 border-t border-l",
  "absolute top-3 right-3 w-5 h-5 border-t border-r",
  "absolute bottom-3 left-3 w-5 h-5 border-b border-l",
  "absolute bottom-3 right-3 w-5 h-5 border-b border-r",
] as const;

export function WonderMailDisplay({
  mail,
  isEuropean,
  onCopy,
  copied,
}: WonderMailDisplayProps) {
  const t = useTranslations("");
  const [isHovered, setIsHovered] = useState(false);
  const scanY = useScanAnimation(isHovered, 1800);

  const regionLabel = isEuropean ? "EU" : "US/JP";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative border backdrop-blur-md rounded-lg overflow-hidden"
      style={{
        background: isHovered
          ? "linear-gradient(145deg, rgba(30,41,59,0.97), rgba(15,23,42,0.97))"
          : "linear-gradient(145deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
        borderColor: isHovered ? "rgba(6,182,212,0.6)" : "rgba(6,182,212,0.35)",
        boxShadow: isHovered
          ? "0 0 60px rgba(6,182,212,0.2), 0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Top neon bar */}
      <div
        className="h-[3px] bg-gradient-to-r from-secondary-hover via-cyan-400 to-secondary-active transition-all duration-300"
        style={{ opacity: isHovered ? 1 : 0.75, boxShadow: isHovered ? "0 0 14px rgba(6,182,212,0.6)" : "none" }}
      />

      {/* Ambient tint */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 55%)",
          opacity: isHovered ? 1 : 0.5,
        }}
      />

      {/* Scan line */}
      {isHovered && (
        <div
          className="absolute inset-x-0 h-px pointer-events-none z-20"
          style={{
            top: `${scanY}%`,
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)",
          }}
        />
      )}

      {/* Corner brackets */}
      {CORNER_BRACKETS.map((cls, i) => (
        <div
          key={i}
          className={`${cls} transition-all duration-300 pointer-events-none`}
          style={{ borderColor: isHovered ? "rgba(34,211,238,0.55)" : "rgba(100,116,139,0.35)" }}
        />
      ))}

      <div className="relative z-10 p-6 sm:p-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HiMail
              className="w-5 h-5 transition-colors duration-300"
              style={{ color: isHovered ? "rgb(34,211,238)" : "rgb(6,182,212)" }}
            />
            <span
              className="text-xs font-mono tracking-[0.35em] uppercase transition-colors duration-300"
              style={{
                fontFamily: "Orbitron, sans-serif",
                color: isHovered ? "rgba(34,211,238,0.9)" : "rgba(6,182,212,0.7)",
              }}
            >
              // {t("WONDER_MAIL_RESULT")}
            </span>
          </div>

          {/* Region badge */}
          <span
            className="text-xs font-mono px-2.5 py-1 rounded border tracking-widest transition-all duration-300"
            style={{
              fontFamily: "Orbitron, sans-serif",
              borderColor: isHovered ? "rgba(6,182,212,0.5)" : "rgba(6,182,212,0.25)",
              color: isHovered ? "rgb(165,243,252)" : "rgb(103,232,249)",
              background: isHovered ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.06)",
            }}
          >
            {regionLabel}
          </span>
        </div>

        {/* Code block */}
        <div
          className="relative rounded-lg p-5 mb-5"
          style={{
            background: "rgba(2,6,23,0.7)",
            border: "1px solid rgba(6,182,212,0.2)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <div className="text-center font-mono text-base sm:text-lg leading-loose text-ink select-all">
            {mail.split("\n").map((line, i) => (
              <div key={i} className="py-0.5 tracking-[0.15em]">
                {line || "\u00A0"}
              </div>
            ))}
          </div>

          {/* Copy button */}
          <motion.button
            onClick={onCopy}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="absolute top-3 right-3 p-2 rounded-lg border transition-all duration-300"
            style={{
              borderColor: copied ? "rgba(34,197,94,0.5)" : "rgba(6,182,212,0.3)",
              background: copied ? "rgba(34,197,94,0.1)" : "rgba(6,182,212,0.06)",
            }}
            title={t("COPY_TO_CLIPBOARD")}
          >
            {copied ? (
              <HiCheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <HiClipboardCopy
                className="w-5 h-5 transition-colors duration-300"
                style={{ color: isHovered ? "rgb(34,211,238)" : "rgb(100,116,139)" }}
              />
            )}
          </motion.button>
        </div>

        {/* Footer hint */}
        <p
          className="text-center text-xs font-mono tracking-widest transition-colors duration-300"
          style={{ color: isHovered ? "rgba(103,232,249,0.6)" : "rgba(100,116,139,0.6)" }}
        >
          {copied ? t("COPIED_SUCCESS") : t("WONDER_MAIL_INSTRUCTIONS")}
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className="h-px transition-opacity duration-500"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)",
          opacity: isHovered ? 0.6 : 0,
        }}
      />
    </motion.div>
  );
}
