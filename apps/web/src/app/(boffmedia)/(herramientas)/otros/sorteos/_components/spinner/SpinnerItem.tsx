import { motion } from "framer-motion"
import { User } from "lucide-react"
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants"

interface SpinnerItemProps {
  name: string
  index: number
  isWinningItem: boolean
  spinComplete: boolean
}

const yellowBoff = BOFF_VARIANTS.yellow

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  // Spread across the hue wheel, avoiding pure red (0°) which looks like an error
  const hues = [210, 265, 145, 185, 320, 45, 25, 290];
  return hues[hash % hues.length];
}

export default function SpinnerItem({ name, index, isWinningItem, spinComplete }: SpinnerItemProps) {
  const showWinningStyles = isWinningItem && spinComplete;
  const hue = nameToHue(name);

  return (
    <div
      key={`${name}-${index}`}
      className="relative flex-shrink-0 w-[180px] h-56 mx-[10px] p-4 rounded-lg flex flex-col items-center justify-center transition-all duration-300"
      style={{
        flexShrink: 0,
        flexGrow: 0,
        flexBasis: "180px",
        border: showWinningStyles
          ? `1px solid ${yellowBoff.border}`
          : `1px solid hsla(${hue}, 45%, 40%, 0.5)`,
        background: showWinningStyles
          ? "linear-gradient(to bottom, rgba(35,28,5,0.95), rgba(20,15,3,0.98))"
          : `linear-gradient(to bottom, hsl(${hue}, 30%, 12%), hsl(${hue}, 20%, 8%))`,
        boxShadow: showWinningStyles
          ? `0 0 28px ${yellowBoff.glowStrong}, 0 0 56px ${yellowBoff.glow}`
          : `0 4px 16px hsla(${hue}, 50%, 25%, 0.18)`,
        transform: showWinningStyles ? "scale(1.08)" : "scale(1)",
      }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg"
        style={{
          background: showWinningStyles
            ? `linear-gradient(135deg, rgba(250,204,21,0.8), rgba(234,179,8,0.6))`
            : `linear-gradient(135deg, hsl(${hue}, 55%, 32%), hsl(${hue}, 45%, 22%))`,
        }}
      >
        <User
          className="w-10 h-10"
          style={{
            color: showWinningStyles
              ? yellowBoff.text
              : `hsl(${hue}, 70%, 80%)`,
          }}
        />
      </div>

      <h3
        className="font-semibold text-center text-sm truncate max-w-full px-2"
        style={{
          color: showWinningStyles
            ? yellowBoff.text
            : `hsl(${hue}, 65%, 82%)`,
        }}
      >
        {name}
      </h3>

      {showWinningStyles && (
        <>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${yellowBoff.tint}, transparent 70%)` }}
          />
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: yellowBoff.text, fontFamily: "Orbitron, sans-serif" }}
          >
            ¡Ganador!
          </motion.span>
        </>
      )}
    </div>
  )
}
