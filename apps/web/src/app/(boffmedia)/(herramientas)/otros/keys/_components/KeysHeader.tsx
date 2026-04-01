import { motion } from "framer-motion";
import { Key } from "lucide-react";

export const KeysHeader = () => (
  <div className="mb-10 relative">
    <div className="absolute -top-6 -left-4 w-72 h-24 bg-secondary-500/10 blur-3xl rounded-full pointer-events-none" />
    <div className="absolute -top-6 left-32 w-40 h-20 bg-accent-500/8 blur-3xl rounded-full pointer-events-none" />

    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-0.5 h-5 bg-gradient-to-b from-secondary-400 to-secondary-600 rounded-full" />
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-secondary-400/60">
            Biblioteca de claves
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-surface-50 mb-2 text-center md:text-left">
          Claves de{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-300 via-secondary-400 to-accent-400">
            Steam
          </span>
        </h1>
        <p className="text-surface-400 text-center md:text-left">
          Biblioteca de claves de juegos para la comunidad
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:block"
      >
        <div className="relative w-[88px] h-[88px]">
          <div className="absolute inset-0 bg-secondary-500/25 rounded-2xl blur-xl" />
          <div className="relative w-full h-full bg-surface-800/80 rounded-2xl border border-secondary-500/30 flex items-center justify-center backdrop-blur-sm">
            <Key className="w-10 h-10 text-secondary-400" />
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);
