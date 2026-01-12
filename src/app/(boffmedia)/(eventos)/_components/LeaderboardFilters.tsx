import { Input } from "@/components/ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { Search, Filter, Trophy } from "lucide-react";
import { useTranslations } from 'next-intl'

interface LeaderboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "score" | "medals" | "achievements";
  sortDirection: "asc" | "desc";
  setSortBy: (sortBy: "score" | "medals" | "achievements") => void;
  setSortDirection: (direction: "asc" | "desc") => void;
  playerCount: number;
}

export function LeaderboardFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
  playerCount,
}: LeaderboardFiltersProps) {
  const t = useTranslations('boffmedia')
  return (
    <div className="bg-gradient-to-r from-surface-800/80 via-accent-900/40 to-surface-800/80 backdrop-blur-sm border border-accent-500/20 rounded-3xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-indigo-400">
              {t('eventsSection.leaderboard.title')}
            </h2>
            <p className="text-surface-400">{playerCount} {t('eventsSection.leaderboard.playersLabel')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
            <Input
              placeholder={t('eventsSection.leaderboard.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-surface-800/60 border-accent-500/30 text-surface-50 placeholder:text-surface-400 focus:border-accent-500/50 focus:ring-accent-500/20"
            />
          </div>

          <Select
            value={`${sortBy}-${sortDirection}`}
            onValueChange={(val) => {
              const [newSortBy, newSortDir] = val.split("-") as ["score" | "medals" | "achievements", "asc" | "desc"]
              setSortBy(newSortBy)
              setSortDirection(newSortDir)
            }}
          >
            <SelectTrigger className="w-full sm:w-48 bg-surface-800/60 border-accent-500/30 text-surface-50 focus:border-accent-500/50 focus:ring-accent-500/20">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('eventsSection.leaderboard.sort.placeholder')} />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-800 border-accent-500/30">
              <SelectItem value="score-desc">{t('eventsSection.leaderboard.sort.scoreDesc')}</SelectItem>
              <SelectItem value="score-asc">{t('eventsSection.leaderboard.sort.scoreAsc')}</SelectItem>
              <SelectItem value="medals-desc">{t('eventsSection.leaderboard.sort.medalsDesc')}</SelectItem>
              <SelectItem value="medals-asc">{t('eventsSection.leaderboard.sort.medalsAsc')}</SelectItem>
              <SelectItem value="achievements-desc">{t('eventsSection.leaderboard.sort.achievementsDesc')}</SelectItem>
              <SelectItem value="achievements-asc">{t('eventsSection.leaderboard.sort.achievementsAsc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
