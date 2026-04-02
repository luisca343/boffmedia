"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gamepad2, ChevronRight, Cpu } from "lucide-react";
import Image from "next/image";
import { useScanAnimation } from "@/hooks/tools/useScanAnimation";

export interface GameTool {
  name: string;
  count: number;
}

export interface GameCardData {
  id: string;
  title: string;
  description: string;
  icon: string;
  tools: GameTool[];
  href: string;
  tag: string;
  topBar: string;
  border: string;
  bgHover: string;
  accent: string;
  dotBg: string;
  countBorder: string;
  countText: string;
  scanLine: string;
  glowColor: string;
}

interface GameCardProps {
  game: GameCardData;
  index: number;
}

export function GameCard({ game, index }: GameCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const scanY = useScanAnimation(isHovered, 1400);

  const totalCount = game.tools.reduce((a, t) => a + t.count, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ delay: index * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
      onClick={() => router.push(game.href)}
    >
      <div
        className="relative h-full border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-500"
        style={{
          background: isHovered
            ? "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))"
            : "linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.90))",
          borderColor: isHovered ? game.scanLine.replace("0.7", "0.5") : "rgba(71,85,105,0.65)",
          boxShadow: isHovered
            ? `0 0 45px ${game.glowColor}, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `0 6px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.02)`,
        }}
      >
        {/* Top neon bar */}
        <div
          className={`h-[3px] bg-gradient-to-r ${game.topBar} transition-all duration-300`}
          style={{
            opacity: isHovered ? 1 : 0.8,
            boxShadow: isHovered ? `0 0 12px ${game.glowColor}` : "none",
          }}
        />

        {/* Ambient inner tint */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${game.glowColor.replace("0.25", "0.18")} 0%, transparent 65%)`,
            opacity: isHovered ? 1 : 0.65,
          }}
        />

        {/* Animated scan line */}
        {isHovered && (
          <div
            className="absolute inset-x-0 h-px pointer-events-none z-20 transition-none"
            style={{
              top: `${scanY}%`,
              background: `linear-gradient(90deg, transparent, ${game.scanLine}, transparent)`,
            }}
          />
        )}

        {/* Background glow on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${game.bgHover} transition-opacity duration-500 pointer-events-none`}
          style={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* Corner brackets */}
        {(
          [
            "absolute top-3 left-3 w-4 h-4 border-t border-l",
            "absolute top-3 right-3 w-4 h-4 border-t border-r",
            "absolute bottom-3 left-3 w-4 h-4 border-b border-l",
            "absolute bottom-3 right-3 w-4 h-4 border-b border-r",
          ] as const
        ).map((cls, i) => (
          <div
            key={i}
            className={`${cls} transition-all duration-300 pointer-events-none`}
            style={{ borderColor: isHovered ? game.scanLine : "rgba(100,116,139,0.55)" }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border ${game.border} bg-surface-950/60 flex items-center justify-center transition-transform duration-300`}
              style={{ transform: isHovered ? "scale(1.08)" : "scale(1)" }}
            >
              {game.icon ? (
                <Image src={game.icon} alt={game.title} width={48} height={48} className="object-contain" />
              ) : (
                <Gamepad2 className="w-8 h-8 text-surface-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className={`text-xs font-mono tracking-[0.3em] ${game.accent} opacity-60 uppercase`}>
                // {game.tag}
              </span>
              <h3
                className={`text-xl font-black text-surface-50 leading-tight mt-0.5 transition-colors duration-300 ${isHovered ? game.accent : ""}`}
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {game.title}
              </h3>
              <p className="text-xs text-surface-500 mt-1">{game.description}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent mb-4" />

          {/* Tool list */}
          <div className="space-y-2 flex-1 mb-5">
            {game.tools.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${game.dotBg} opacity-70 flex-shrink-0`} />
                  <span className="text-sm text-surface-300">{tool.name}</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border ${game.countBorder} bg-surface-950/50 ${game.countText}`}
                >
                  {String(tool.count).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-800/50">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-surface-600" />
              <span className="text-xs font-mono text-surface-600 tracking-widest">
                {String(totalCount).padStart(2, "0")} TOOLS
              </span>
            </div>
            <motion.span
              className={`flex items-center gap-1 text-xs font-mono font-bold tracking-widest ${game.accent} uppercase`}
              style={{ fontFamily: "Orbitron, sans-serif" }}
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ACCEDER
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.span>
          </div>
        </div>

        {/* Bottom glow line */}
        <div
          className={`h-px bg-gradient-to-r ${game.topBar} transition-opacity duration-500`}
          style={{ opacity: isHovered ? 0.5 : 0.2 }}
        />
      </div>
    </motion.div>
  );
}
