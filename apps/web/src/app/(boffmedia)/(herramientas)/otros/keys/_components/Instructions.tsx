import { motion } from "framer-motion";
import { Info } from "lucide-react";

export const Instructions = () => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.6 }}
    className="mt-8 p-4 md:p-6 bg-surface-800/80 border border-dashed border-surface-700 rounded-lg"
  >
    <h3 className="text-xl font-semibold text-surface-100 mb-3 flex items-center gap-2">
      <Info className="w-5 h-5 text-secondary-400" />
      Cómo usar las claves
    </h3>
    <ul className="space-y-2 text-surface-300">
      <li className="flex items-start gap-2">
        <div className="min-w-4 mt-1">1.</div>
        <p>Haz clic en cualquier juego disponible para ver sus detalles.</p>
      </li>
      <li className="flex items-start gap-2">
        <div className="min-w-4 mt-1">2.</div>
        <p>Solicita la clave a los administradores a través del canal de Discord.</p>
      </li>
      <li className="flex items-start gap-2">
        <div className="min-w-4 mt-1">3.</div>
        <p>Activa la clave en tu cuenta de Steam siguiendo las instrucciones proporcionadas.</p>
      </li>
    </ul>
  </motion.div>
);