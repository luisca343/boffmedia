import { motion } from "framer-motion"
import { BOFF_VARIANTS } from "@/components/boffmedia-old/tools/utils/boffVariants"

interface SpinnerItemProps {
  name: string
  index: number
  isWinningItem: boolean
  spinComplete: boolean
}

const yellowBoff = BOFF_VARIANTS.yellow;

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  const hues = [210, 265, 145, 185, 320, 45, 25, 290];
  return hues[hash % hues.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function SpinnerItem({ name, index, isWinningItem, spinComplete }: SpinnerItemProps) {
  const showWin = isWinningItem && spinComplete;
  const hue     = nameToHue(name);
  const initials = getInitials(name);

  return (
    <div
      key={`${name}-${index}`}
      className="relative flex-shrink-0 h-64 mx-[10px] p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-500"
      style={{
        width: "180px",
        border: showWin
          ? `1.5px solid ${yellowBoff.border}`
          : `1px solid hsla(${hue}, 45%, 28%, 0.65)`,
        background: showWin
          ? "linear-gradient(160deg, rgba(42,33,5,0.98), rgba(22,17,2,0.99))"
          : `linear-gradient(160deg, hsl(${hue}, 22%, 10%), hsl(${hue}, 16%, 7%))`,
        boxShadow: showWin
          ? `0 0 30px ${yellowBoff.glowStrong}, 0 0 80px ${yellowBoff.glow}, inset 0 0 20px rgba(250,204,21,0.04)`
          : `0 4px 20px hsla(${hue}, 50%, 18%, 0.2)`,
        transform: showWin ? "scale(1.07)" : "scale(1)",
      }}
    >
      {/* Initials avatar */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-3 font-black text-2xl select-none shadow-lg"
        style={{
          background: showWin
            ? "linear-gradient(135deg, rgba(250,204,21,0.9), rgba(234,179,8,0.75))"
            : `linear-gradient(135deg, hsl(${hue}, 55%, 32%), hsl(${hue}, 45%, 20%))`,
          color: showWin
            ? "rgba(15,12,2,0.95)"
            : `hsl(${hue}, 80%, 92%)`,
          fontFamily: "Orbitron, sans-serif",
          boxShadow: showWin
            ? `0 0 20px ${yellowBoff.glow}, 0 4px 16px rgba(0,0,0,0.5)`
            : `0 4px 14px hsla(${hue}, 50%, 18%, 0.35)`,
          letterSpacing: initials.length > 1 ? "-0.05em" : "0",
        }}
      >
        {initials}
      </div>

      {/* Name */}
      <p
        className="font-semibold text-center text-xs truncate max-w-full px-2 tracking-wide"
        style={{
          color: showWin ? yellowBoff.text : `hsl(${hue}, 60%, 78%)`,
        }}
      >
        {name}
      </p>

      {/* Winning badge + glow */}
      {showWin && (
        <>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.38, 0.12] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${yellowBoff.tint}, transparent 70%)` }}
          />
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded"
            style={{
              color: "rgba(12,9,2,0.95)",
              background: yellowBoff.text,
              fontFamily: "Orbitron, sans-serif",
            }}
          >
            GANADOR
          </motion.span>
        </>
      )}
    </div>
  );
}
