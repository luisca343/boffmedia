"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Sparkles, Crown, Star } from "lucide-react";
import { BoffContainer } from "@/components/boffmedia-old/tools/BoffContainer";
import { BoffButton } from "@/components/boffmedia-old/tools/BoffButton";
import { BOFF_VARIANTS } from "@/components/boffmedia-old/tools/utils/boffVariants";
import { getBoffStyle } from "@/components/boffmedia-old/tools/utils/getBoffStyle";

interface WinnerDisplayProps {
  winner: string;
  onReset: () => void;
  roundNumber?: number;
}

const yellowBoff  = BOFF_VARIANTS.yellow;
const yellowStyle = getBoffStyle("yellow");

const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};
const trophyAnim = {
  idle: {
    y: [0, -14, 0],
    rotate: [0, -2, 2, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const burstIcons = [
  { icon: Trophy,   color: yellowBoff.text,       pos: "top-4 left-4",     delay: 0   },
  { icon: Sparkles, color: "rgb(34,211,238)",       pos: "top-4 right-4",    delay: 0.4 },
  { icon: Star,     color: "rgb(163,230,53)",       pos: "bottom-4 left-4",  delay: 0.8 },
  { icon: Crown,    color: "rgb(192,132,252)",      pos: "bottom-4 right-4", delay: 1.2 },
];

export function WinnerDisplay({ winner, onReset, roundNumber }: WinnerDisplayProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id:       i,
        left:     Math.random() * 100,
        top:      Math.random() * 100,
        duration: 2.5 + Math.random() * 2.5,
        delay:    Math.random() * 2.5,
        size:     2 + Math.floor(Math.random() * 3),
      })),
    []
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col items-center justify-center text-center py-10 px-6 min-h-[500px] overflow-hidden"
    >
      {/* Burst corner icons */}
      {burstIcons.map(({ icon: Icon, color, pos, delay }, i) => (
        <motion.div
          key={i}
          className={`absolute ${pos}`}
          style={{ color }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.3, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 3.5, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="w-7 h-7" />
        </motion.div>
      ))}

      {/* Round badge */}
      {roundNumber !== undefined && (
        <motion.div variants={fadeUp} className="mb-5">
          <span
            className="text-[10px] font-black px-3 py-1 rounded-full border tracking-[0.25em] uppercase"
            style={{
              fontFamily: "Orbitron, sans-serif",
              color: yellowBoff.text,
              borderColor: yellowBoff.border,
              background: "rgba(250,204,21,0.08)",
            }}
          >
            Ronda #{roundNumber}
          </span>
        </motion.div>
      )}

      {/* Trophy */}
      <motion.div variants={fadeUp} className="relative mb-5">
        <motion.div variants={trophyAnim} animate="idle" className="relative z-10">
          <Trophy className="w-24 h-24 drop-shadow-lg" style={{ color: yellowBoff.text }} />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.12, 0.42, 0.12] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
          style={{ background: yellowBoff.tint }}
        />
      </motion.div>

      {/* Headline */}
      <motion.div variants={fadeUp} className="mb-5">
        <h2
          className="text-3xl sm:text-4xl font-black tracking-tight"
          style={{
            fontFamily: "Orbitron, sans-serif",
            backgroundImage: `linear-gradient(135deg, ${yellowBoff.text} 0%, #fde68a 50%, ${yellowBoff.text} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ¡Tenemos un ganador!
        </h2>
      </motion.div>

      {/* Winner name card */}
      <motion.div variants={fadeUp} className="mb-5 w-full max-w-xl">
        <BoffContainer variant="yellow" contentClassName="py-6 px-8">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: yellowBoff.text }} />
            <h3
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold break-words text-center"
              style={{
                fontFamily: "Orbitron, sans-serif",
                backgroundImage: `linear-gradient(135deg, #fde68a 0%, ${yellowBoff.text} 50%, #fde68a 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {winner}
            </h3>
            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: yellowBoff.text }} />
          </div>
        </BoffContainer>
      </motion.div>

      {/* Congrats */}
      <motion.p variants={fadeUp} className="text-surface-400 text-sm tracking-wide mb-8">
        ¡Felicidades al ganador del sorteo!
      </motion.p>

      {/* CTA */}
      <motion.div variants={fadeUp}>
        <BoffButton boff={yellowStyle} onClick={onReset}>
          Continuar Sorteo
        </BoffButton>
      </motion.div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left:     `${p.left}%`,
              top:      `${p.top}%`,
              width:    p.size,
              height:   p.size,
              background: yellowBoff.glowStrong,
            }}
            animate={{ y: [0, -24, 0], opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
