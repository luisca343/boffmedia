import { motion } from "framer-motion"
import { User } from "lucide-react"

interface SpinnerItemProps {
  name: string
  index: number
  isWinningItem: boolean
  spinComplete: boolean
}

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
      className="relative flex-shrink-0 w-[180px] h-56 mx-[10px] p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300"
      style={{
        flexShrink: 0,
        flexGrow: 0,
        flexBasis: '180px',
        border: showWinningStyles
          ? '2px solid hsl(45, 100%, 55%)'
          : `1px solid hsla(${hue}, 45%, 40%, 0.5)`,
        background: showWinningStyles
          ? 'linear-gradient(to bottom, hsl(45, 70%, 13%), hsl(35, 60%, 9%))'
          : `linear-gradient(to bottom, hsl(${hue}, 30%, 12%), hsl(${hue}, 20%, 8%))`,
        boxShadow: showWinningStyles
          ? '0 0 28px hsla(45, 100%, 55%, 0.35), 0 0 56px hsla(45, 100%, 55%, 0.12)'
          : `0 4px 16px hsla(${hue}, 50%, 25%, 0.18)`,
        transform: showWinningStyles ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg"
        style={{
          background: showWinningStyles
            ? 'linear-gradient(135deg, hsl(45, 85%, 48%), hsl(35, 85%, 36%))'
            : `linear-gradient(135deg, hsl(${hue}, 55%, 32%), hsl(${hue}, 45%, 22%))`,
        }}
      >
        <User
          className="w-10 h-10"
          style={{ color: showWinningStyles ? 'hsl(45, 100%, 85%)' : `hsl(${hue}, 70%, 80%)` }}
        />
      </div>

      <h3
        className="font-semibold text-center text-sm truncate max-w-full px-2"
        style={{ color: showWinningStyles ? 'hsl(45, 100%, 78%)' : `hsl(${hue}, 65%, 82%)` }}
      >
        {name}
      </h3>

      {showWinningStyles && (
        <>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsla(45, 100%, 55%, 0.18), transparent 70%)' }}
          />
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'hsl(45, 100%, 68%)' }}
          >
            ¡Ganador!
          </motion.span>
        </>
      )}
    </div>
  )
}