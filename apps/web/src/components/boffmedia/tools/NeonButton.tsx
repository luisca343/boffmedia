"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { NeonStyle } from "@components/boffmedia/tools/utils/getNeonStyle";

interface NeonButtonProps {
  /** Optionally force the hovered visual state (e.g. when the parent card is hovered) */
  isHovered?: boolean;
  neon: NeonStyle;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function NeonButton({
  isHovered,
  neon,
  children,
  onClick,
  className,
}: NeonButtonProps) {
  const [selfHovered, setSelfHovered] = useState(false);
  const hovered = isHovered ?? selfHovered;

  // Derive semi-transparent backgrounds from the strong glow token
  const bgHover = neon.glow.replace("0.3", "0.12");
  const bgDefault = neon.glow.replace("0.3", "0.06");
  const borderDefault = neon.glow.replace("0.3", "0.2");

  return (
    <motion.button
      className={`flex items-center gap-3 px-6 py-3 rounded-lg border font-mono text-sm font-bold tracking-widest uppercase transition-all duration-300 ${className ?? ""}`}
      style={{
        fontFamily: "Orbitron, sans-serif",
        borderColor: hovered ? neon.border : borderDefault,
        color: neon.text,
        background: hovered ? bgHover : bgDefault,
        boxShadow: hovered ? `0 0 20px ${neon.glow}` : "none",
      }}
      animate={{ x: hovered ? 3 : 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      onHoverStart={() => setSelfHovered(true)}
      onHoverEnd={() => setSelfHovered(false)}
    >
      {children}
      <ArrowRight className="w-4 h-4" />
    </motion.button>
  );
}
