"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HiMail, HiSparkles } from "react-icons/hi";
import { useTranslations } from "next-intl";

interface GenerateButtonProps {
  onClick: () => void;
}

export function GenerateButton({ onClick }: GenerateButtonProps) {
  const t = useTranslations("");
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full overflow-hidden rounded-lg border font-mono font-bold tracking-widest uppercase transition-all duration-300"
      style={{
        fontFamily: "Orbitron, sans-serif",
        fontSize: "0.8rem",
        letterSpacing: "0.25em",
        padding: "1rem 2rem",
        borderColor: isHovered ? "rgba(6,182,212,0.7)" : "rgba(6,182,212,0.3)",
        background: isHovered
          ? "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(34,211,238,0.12) 100%)"
          : "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(34,211,238,0.05) 100%)",
        color: isHovered ? "rgb(165,243,252)" : "rgb(103,232,249)",
        boxShadow: isHovered
          ? "0 0 30px rgba(6,182,212,0.25), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Ambient glow layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.12) 0%, transparent 65%)",
          opacity: isHovered ? 1 : 0.4,
        }}
      />

      {/* Scan line on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-x-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)" }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-3">
        <HiMail className="w-5 h-5 flex-shrink-0" />
        {t("GENERATE_WONDER_MAIL")}
        <motion.span animate={{ rotate: isHovered ? 20 : 0 }} transition={{ duration: 0.3 }}>
          <HiSparkles className="w-5 h-5 flex-shrink-0" />
        </motion.span>
      </span>
    </motion.button>
  );
}
