import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { KeyRow } from "./KeyRow";

export interface KeyItem {
  name: string;
  key: string;
  source: string;
  claimed: string;
  steamID: string;
  imageUrl: string;
  count?: number;
}

interface KeysDataTableProps {
  keys: KeyItem[];
  hoveredRow: string | null;
  setHoveredRow: (name: string | null) => void;
  fetchGameData: (steamId: string) => void;
}

export const KeysDataTable = ({
  keys,
  hoveredRow,
  setHoveredRow,
  fetchGameData,
}: KeysDataTableProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
  >
    <AnimatePresence mode="popLayout">
      {keys.length > 0 ? (
        <div className="space-y-2">
          {keys.map((key, index) => (
            <KeyRow
              key={`${key.name}-${key.claimed}-${index}`}
              keyData={key}
              index={index}
              hoveredRow={hoveredRow}
              setHoveredRow={setHoveredRow}
              fetchGameData={fetchGameData}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-secondary-500/10 blur-2xl rounded-full" />
            <div className="relative w-20 h-20 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center">
              <Gamepad2 className="w-9 h-9 text-surface-500" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-surface-300 font-medium">No se encontraron claves</p>
            <p className="text-surface-500 text-sm mt-1">Prueba con otro término de búsqueda</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);
