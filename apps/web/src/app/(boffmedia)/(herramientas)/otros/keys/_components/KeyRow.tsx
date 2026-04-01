import { motion } from "framer-motion";
import { Gift, Key, ExternalLink, CheckCircle2 } from "lucide-react";
import { KeyItem } from "./KeysDataTable";

interface KeyRowProps {
  keyData: KeyItem;
  index: number;
  hoveredRow: string | null;
  setHoveredRow: (name: string | null) => void;
  fetchGameData: (steamId: string) => void;
}

export const KeyRow = ({
  keyData: key,
  index,
  setHoveredRow,
  fetchGameData,
}: KeyRowProps) => {
  const isClaimed = key.claimed === "s";

  return (
    <motion.div
      className="group relative flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700/40 hover:border-secondary-500/40 hover:bg-surface-800/80 transition-all duration-200 cursor-pointer overflow-hidden"
      onMouseEnter={() => setHoveredRow(key.name)}
      onMouseLeave={() => setHoveredRow(null)}
      onClick={() => fetchGameData(key.steamID)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
    >
      {/* Hover glow sweep */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-secondary-500/6 via-transparent to-transparent pointer-events-none" />

      {/* Index */}
      <span className="hidden sm:block text-surface-600 text-xs font-mono w-5 text-right flex-shrink-0 select-none">
        {index + 1}
      </span>

      {/* Game image */}
      <div className="w-20 h-12 md:w-24 md:h-14 rounded-lg overflow-hidden bg-surface-900 flex-shrink-0 border border-surface-700/50 group-hover:border-secondary-500/30 transition-colors duration-200">
        {key.imageUrl ? (
          <img
            src={key.imageUrl}
            alt={key.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML =
                  '<div class="w-full h-full flex items-center justify-center bg-surface-800"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-600"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-800/50">
            <Gift className="w-5 h-5 text-surface-600" />
          </div>
        )}
      </div>

      {/* Game info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-surface-100 truncate group-hover:text-white transition-colors duration-150 leading-tight">
            {key.name}
          </span>
          {key.count && key.count > 1 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary-500/15 border border-secondary-500/30 text-secondary-400 text-xs font-medium flex-shrink-0">
              ×{key.count}
            </span>
          )}
        </div>
        <p className="text-xs text-surface-500 mt-0.5 group-hover:text-surface-400 transition-colors duration-150">
          Clic para ver detalles
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Status badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
            isClaimed
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-highlight-500/10 text-highlight-400 border border-highlight-500/20"
          }`}
        >
          {isClaimed ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Key className="w-3 h-3" />
          )}
          <span>{isClaimed ? "Reclamada" : "Disponible"}</span>
        </div>

        {/* Mobile: icon-only status */}
        <div
          className={`sm:hidden flex items-center justify-center w-7 h-7 rounded-lg ${
            isClaimed
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-highlight-500/10 text-highlight-400 border border-highlight-500/20"
          }`}
        >
          {isClaimed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
        </div>

        {/* Steam link */}
        <a
          href={`https://store.steampowered.com/app/${key.steamID}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-700/50 border border-surface-600/50 text-surface-400 hover:text-secondary-400 hover:border-secondary-500/40 hover:bg-secondary-500/10 transition-all duration-150"
          target="_blank"
          rel="noopener noreferrer"
          title="Ver en Steam"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.div>
  );
};
