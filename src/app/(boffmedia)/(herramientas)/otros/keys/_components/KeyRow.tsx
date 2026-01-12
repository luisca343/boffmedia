import { motion } from "framer-motion";
import { TableCell, TableRow } from "@/components/ui/primitives/table";
import { Badge } from "@/components/ui/primitives/badge";
import { Gift, Key, ExternalLink, Clock } from "lucide-react";
import { KeyItem } from "./KeysDataTable";
import { useTranslations } from 'next-intl';

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
  hoveredRow,
  setHoveredRow,
  fetchGameData
}: KeyRowProps) => {
  const t = useTranslations('boffmedia.keys');

  return (
  <motion.tr
    key={`${key.name}-${key.claimed}-${index}`}
    className="hover:bg-surface-700 transition-colors duration-200 cursor-pointer border-b border-surface-700/50 last:border-b-0"
    onMouseEnter={() => setHoveredRow(key.name)}
    onMouseLeave={() => setHoveredRow(null)}
    onClick={() => fetchGameData(key.steamID)}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
  >
    <TableCell className="font-medium text-surface-400 py-3 px-4">
      {index + 1}
    </TableCell>
    <TableCell className="py-3 px-4">
      <div className="w-10 h-10 bg-surface-900/50 rounded-md overflow-hidden border border-surface-700 flex items-center justify-center">
          {key.imageUrl ? (
          <img
            src={key.imageUrl}
            alt={t('row.imageAlt', { name: key.name })}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'flex items-center justify-center w-full h-full';
                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-500"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <Gift className="w-5 h-5 text-surface-500" />
        )}
      </div>
    </TableCell>
    <TableCell className="font-medium py-3 px-4">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-surface-50">
          {key.name} {key.count && key.count > 1 && (
            <Badge variant="outline" className="ml-2 text-xs border-secondary-500/30 text-secondary-400">
              x{key.count}
            </Badge>
          )}
        </span>
        <a
          href={`https://store.steampowered.com/app/${key.steamID}`}
          onClick={(e) => e.stopPropagation()}
          className="text-secondary-400 hover:text-secondary-300 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      {hoveredRow === key.name && (
        <div className="text-xs text-surface-400 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('row.clickHint')}
        </div>
      )}
    </TableCell>
    {/*<TableCell className="text-surface-300 py-3 px-4">{key.source}</TableCell>*/}
    <TableCell className="py-3 px-4">
      <motion.div
        className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full  ${
          key.claimed === "s" 
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-highlight-500/20 text-highlight-400 border border-highlight-500/30"
        }`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Key className="w-3.5 h-3.5" />
        <span className="text-sm font-medium">
          {key.claimed === "s" ? t('row.claimed') : t('row.available')}
        </span>
      </motion.div>
    </TableCell>
  </motion.tr>
  );
};
 