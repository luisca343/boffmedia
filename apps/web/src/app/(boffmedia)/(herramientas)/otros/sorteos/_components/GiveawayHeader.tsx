import { motion } from "framer-motion";
import { Gift } from "lucide-react";

export function GiveawayHeader() {
  return (
    <div className="mb-4 relative">
      <div className="absolute -top-6 -left-4 w-72 h-24 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -top-6 left-32 w-40 h-20 bg-warning-500/8 blur-3xl rounded-full pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-0.5 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-primary-400/60">
              Herramienta de sorteos
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-surface-50 mb-2 text-center md:text-left">
            Sorteo{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-orange-400 to-yellow-400">
              BoffMedia
            </span>
          </h1>
          <p className="text-surface-400 text-center md:text-left">
            Realiza sorteos justos y transparentes para tu comunidad
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden md:block"
        >
          <div className="relative w-[88px] h-[88px]">
            <div className="absolute inset-0 bg-primary-500/25 rounded-2xl blur-xl" />
            <div className="relative w-full h-full bg-surface-800/80 rounded-2xl border border-primary-500/30 flex items-center justify-center backdrop-blur-sm">
              <Gift className="w-10 h-10 text-primary-400" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
