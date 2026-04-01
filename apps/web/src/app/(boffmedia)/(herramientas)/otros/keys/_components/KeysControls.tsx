import { motion } from "framer-motion";
import { Search, Key, CheckCircle2, Library } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";

interface KeysControlsProps {
  filter: string;
  setFilter: (value: string) => void;
  showClaimed: boolean;
  setShowClaimed: (value: boolean) => void;
  availableCount: number;
  claimedCount: number;
  totalCount: number;
}

const StatPill = ({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
}) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-900/60 border ${color}`}>
    <Icon className="w-3.5 h-3.5 opacity-70" />
    <span className="text-xs text-surface-400">{label}</span>
    <span className="text-sm font-semibold tabular-nums">{count}</span>
  </div>
);

export const KeysControls = ({
  filter,
  setFilter,
  showClaimed,
  setShowClaimed,
  availableCount,
  claimedCount,
  totalCount,
}: KeysControlsProps) => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.3 }}
    className="mb-6"
  >
    <div className="bg-surface-800/60 backdrop-blur-sm border border-surface-700/60 rounded-2xl p-4 md:p-5 space-y-4">
      {/* Search + Toggle row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500 pointer-events-none" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar juego o bundle..."
            className="bg-surface-900/70 border-surface-600/50 text-surface-100 pl-10 h-10 rounded-xl focus-visible:ring-secondary-500/50 focus-visible:border-secondary-500/50 placeholder:text-surface-600 transition-all duration-200"
          />
        </div>

        {/* Segmented toggle */}
        <div className="flex rounded-xl overflow-hidden border border-surface-600/50 bg-surface-900/50 p-1 gap-1 flex-shrink-0">
          <button
            onClick={() => setShowClaimed(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              !showClaimed
                ? "bg-secondary-500/20 text-secondary-300 shadow-sm border border-secondary-500/30"
                : "text-surface-400 hover:text-surface-200 border border-transparent"
            }`}
          >
            Disponibles
          </button>
          <button
            onClick={() => setShowClaimed(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              showClaimed
                ? "bg-surface-600/80 text-surface-100 border border-surface-500/30"
                : "text-surface-400 hover:text-surface-200 border border-transparent"
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2">
        <StatPill
          icon={Library}
          label="Total"
          count={totalCount}
          color="border-surface-600/50 text-surface-200"
        />
        <StatPill
          icon={Key}
          label="Disponibles"
          count={availableCount}
          color="border-highlight-500/30 text-highlight-400"
        />
        <StatPill
          icon={CheckCircle2}
          label="Reclamadas"
          count={claimedCount}
          color="border-red-500/30 text-red-400"
        />
      </div>
    </div>
  </motion.div>
);
