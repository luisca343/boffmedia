"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { NeonStyle } from "@components/boffmedia/tools/utils/getNeonStyle";

interface NeonButtonProps {
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

  return (
    <motion.button
      className={`flex items-center gap-3 px-6 py-3 rounded-lg border font-mono text-sm font-bold tracking-widest uppercase transition-all duration-300 ${className ?? ""}`}
      style={{
        fontFamily: "Orbitron, sans-serif",
        borderColor: hovered ? neon.border : "rgba(249,115,22,0.3)",
        color: "rgb(251,146,60)",
        background: hovered
          ? "rgba(249,115,22,0.1)"
          : "rgba(249,115,22,0.05)",
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