import { motion } from "framer-motion";
import { Search, Filter, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Badge } from "@/components/ui/primitives/badge";
import { useTranslations } from "next-intl";

interface KeysControlsProps {
  filter: string;
  setFilter: (value: string) => void;
  showClaimed: boolean;
  setShowClaimed: (value: boolean) => void;
  availableCount: number;
  claimedCount: number;
  totalCount: number;
}

export const KeysControls = ({
  filter,
  setFilter,
  showClaimed,
  setShowClaimed,
  availableCount,
  claimedCount,
  totalCount,
}: KeysControlsProps) => {
  const t = useTranslations('boffmedia.keys');

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mb-8"
    >
      <div className="bg-surface-800 border border-surface-700 rounded-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('controls.searchPlaceholder')}
              className="bg-surface-700 border-surface-600 text-surface-100 pl-9 py-5 focus-visible:ring-secondary-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showClaimed}
                  onChange={() => setShowClaimed(!showClaimed)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-600 rounded-full transition peer-checked:bg-secondary-500 peer-focus:ring-4 peer-focus:ring-secondary-400/25"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition transform peer-checked:translate-x-5 peer-checked:bg-surface-900"></div>
              </div>
              <span className="text-sm md:text-base font-medium text-secondary-300 group-hover:text-secondary-400 transition">
                {showClaimed ? t('controls.showClaimed.hide') : t('controls.showClaimed.show')}
              </span>
            </label>
            <Button variant="outline" size="icon" className="border-surface-600 text-surface-300 hover:text-secondary-400">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-surface-700 text-surface-300 hover:bg-surface-600">
              {t('controls.badges.allGames', { count: totalCount })}
            </Badge>
            <Badge className="bg-highlight-600/20 text-highlight-400 hover:bg-highlight-700/30 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-highlight-400"></div>
              {t('controls.badges.available', { count: availableCount })}
            </Badge>
            <Badge className="bg-red-600/20 text-red-400 hover:bg-red-700/30 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              {t('controls.badges.claimed', { count: claimedCount })}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-surface-400 hover:text-secondary-400">
            <ArrowDownUp className="h-3 w-3 mr-1" />
            {t('controls.sortButton')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};