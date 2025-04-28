import { motion } from "framer-motion";
import { Key } from "lucide-react";

export const KeysHeader = () => (
  <div className="mb-10">
    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-surface-50 mb-2">
          Claves de <span className="text-blue-400">Steam</span>
        </h1>
        <p className="text-xl text-surface-300 text-center md:text-left">
          Biblioteca de claves de juegos para la comunidad
        </p>
      </motion.div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:block"
      >
        <div className="w-[90px] h-[100px] bg-surface-800/70 rounded-lg border border-surface-700 flex items-center justify-center">
          <Key className="w-12 h-12 text-blue-400" />
        </div>
      </motion.div>
    </div>
  </div>
);