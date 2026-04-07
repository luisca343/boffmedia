"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { BoffContainer } from "@/components/boffmedia/tools/BoffContainer";
import { BoffButton } from "@/components/boffmedia/tools/BoffButton";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";
import { getBoffStyle } from "@/components/boffmedia/tools/utils/getBoffStyle";

interface WinnerDisplayProps {
  winner: string;
  onReset: () => void;
}

const yellowBoff = BOFF_VARIANTS.yellow;
const yellowStyle = getBoffStyle("yellow");

const celebrationItems = [
  { icon: Trophy,    color: yellowBoff.text,                    position: "top-8 left-8",    delay: 0 },
  { icon: Sparkles,  color: "rgb(34,211,238)",                  position: "top-8 right-8",   delay: 0.5 },
  { icon: Trophy,    color: "rgb(163,230,53)",                  position: "bottom-8 left-8", delay: 1 },
  { icon: Sparkles,  color: "rgb(192,132,252)",                 position: "bottom-8 right-8",delay: 1.5 },
];

const containerVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25, staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const trophyVariants = {
  idle: {
    y: [0, -15, 0],
    rotate: [0, -3, 3, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export function WinnerDisplay({ winner, onReset }: WinnerDisplayProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      })),
    []
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col items-center justify-center text-center py-12 px-6 min-h-[500px] overflow-hidden"
    >
      {/* Celebration corner icons */}
      {celebrationItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={index}
            className={`absolute ${item.position}`}
            style={{ color: item.color }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0], rotate: 360 }}
            transition={{ duration: 3, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="w-8 h-8" />
          </motion.div>
        );
      })}

      {/* Trophy */}
      <motion.div variants={itemVariants} className="relative mb-8">
        <motion.div variants={trophyVariants} animate="idle" className="relative z-10">
          <Trophy className="w-28 h-28 drop-shadow-lg" style={{ color: yellowBoff.text }} />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ background: yellowBoff.tint }}
        />
      </motion.div>

      {/* Headline */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2
          className="text-4xl sm:text-5xl font-black mb-4"
          style={{
            fontFamily: "Orbitron, sans-serif",
            background: `linear-gradient(135deg, ${yellowBoff.text} 0%, #fde68a 50%, ${yellowBoff.text} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ¡Tenemos un ganador!
        </h2>
      </motion.div>

      {/* Winner card */}
      <motion.div variants={itemVariants} className="mb-8 max-w-2xl w-full">
        <BoffContainer variant="yellow" contentClassName="p-8">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 flex-shrink-0" style={{ color: yellowBoff.text }} />
            <h3
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold break-words text-center"
              style={{
                fontFamily: "Orbitron, sans-serif",
                background: `linear-gradient(135deg, #fde68a 0%, ${yellowBoff.text} 50%, #fde68a 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {winner}
            </h3>
            <Sparkles className="w-6 h-6 flex-shrink-0" style={{ color: yellowBoff.text }} />
          </div>
        </BoffContainer>
      </motion.div>

      {/* Congratulations */}
      <motion.div variants={itemVariants} className="mb-8">
        <p className="text-surface-400 text-sm tracking-wide">
          ¡Felicidades al ganador del sorteo!
        </p>
      </motion.div>

      {/* Continue button */}
      <motion.div variants={itemVariants}>
        <BoffButton boff={yellowStyle} onClick={onReset}>
          Continuar Sorteo
        </BoffButton>
      </motion.div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: yellowBoff.glowStrong,
            }}
            animate={{ y: [0, -20, 0], opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
