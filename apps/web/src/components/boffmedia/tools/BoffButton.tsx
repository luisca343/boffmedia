"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { BoffStyle } from "@components/boffmedia/tools/utils/getBoffStyle";

interface BoffButtonProps {
  /** Optionally force the hovered visual state (e.g. when the parent card is hovered) */
  isHovered?: boolean;
  boff: BoffStyle;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function BoffButton({
  isHovered,
  boff,
  children,
  onClick,
  className,
}: BoffButtonProps) {
  const [selfHovered, setSelfHovered] = useState(false);
  const hovered = isHovered ?? selfHovered;

  // Derive semi-transparent backgrounds from the strong glow token
  const bgHover = boff.glow.replace("0.3", "0.12");
  const bgDefault = boff.glow.replace("0.3", "0.06");
  const borderDefault = boff.glow.replace("0.3", "0.2");

  return (
    <motion.button
      className={`flex items-center gap-3 px-6 py-3 rounded-lg border font-mono text-sm font-bold tracking-widest uppercase transition-all duration-300 ${className ?? ""}`}
      style={{
        fontFamily: "Orbitron, sans-serif",
        borderColor: hovered ? boff.border : borderDefault,
        color: boff.text,
        background: hovered ? bgHover : bgDefault,
        boxShadow: hovered ? `0 0 20px ${boff.glow}` : "none",
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
