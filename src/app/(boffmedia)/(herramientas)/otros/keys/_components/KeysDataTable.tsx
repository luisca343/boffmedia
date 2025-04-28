import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  fetchGameData
}: KeysDataTableProps) => (
  <motion.div
    className="bg-surface-800 rounded-lg shadow-lg overflow-hidden border border-surface-700"
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.4 }}
  >
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-900 border-b border-surface-700">
            <TableHead className="text-blue-400 font-medium w-[60px]">#</TableHead>
            <TableHead className="text-blue-400 font-medium w-[80px]">Imagen</TableHead>
            <TableHead className="text-blue-400 font-medium">Juego</TableHead>
            <TableHead className="text-blue-400 font-medium">Bundle</TableHead>
            <TableHead className="text-blue-400 font-medium w-[120px]">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {keys.length > 0 ? (
              keys.map((key, index) => (
                <KeyRow
                  key={`${key.name}-${key.claimed}-${index}`}
                  keyData={key}
                  index={index}
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                  fetchGameData={fetchGameData}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-surface-400">
                  No se encontraron claves que coincidan con tu búsqueda
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  </motion.div>
);