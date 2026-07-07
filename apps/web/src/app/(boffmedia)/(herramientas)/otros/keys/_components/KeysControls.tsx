import { motion } from "framer-motion";
import { Search, Key, CheckCircle2, Library, type LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  label: string;
  count: number;
  color: string;
}) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-layer-1/60 border ${color}`}>
    <Icon className="w-3.5 h-3.5 opacity-70" />
    <span className="text-xs text-ink-muted">{label}</span>
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
    <div className="bg-layer-2/60 backdrop-blur-sm border border-edge/60 rounded-2xl p-4 md:p-5 space-y-4">
      {/* Search + Toggle row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar juego o bundle..."
            className="bg-layer-1/70 border-edge/50 text-ink pl-10 h-10 rounded-xl focus-visible:ring-secondary/50 focus-visible:border-secondary/50 placeholder:text-ink-dim transition-all duration-200"
          />
        </div>

        {/* Segmented toggle */}
        <div className="flex rounded-xl overflow-hidden border border-edge/50 bg-layer-1/50 p-1 gap-1 flex-shrink-0">
          <button
            onClick={() => setShowClaimed(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              !showClaimed
                ? "bg-secondary/20 text-secondary-hover shadow-sm border border-secondary/30"
                : "text-ink-muted hover:text-ink border border-transparent"
            }`}
          >
            Disponibles
          </button>
          <button
            onClick={() => setShowClaimed(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              showClaimed
                ? "bg-layer-3/80 text-ink border border-edge/30"
                : "text-ink-muted hover:text-ink border border-transparent"
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
          color="border-edge/50 text-ink"
        />
        <StatPill
          icon={Key}
          label="Disponibles"
          count={availableCount}
          color="border-warning-border/30 text-warning-hover"
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
