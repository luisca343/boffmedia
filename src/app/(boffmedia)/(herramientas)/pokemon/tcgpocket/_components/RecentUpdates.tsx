import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown, AlertCircle } from 'lucide-react'
import { RecentUpdate } from '../types'
import { useTranslations } from "next-intl"

interface RecentUpdatesProps {
  recentUpdates: RecentUpdate[]
  recentUpdatesError: string | null
  recentUpdatesLoading: boolean
  fetchRecentUpdates: () => void
}

export function RecentUpdates({
  recentUpdates,
  recentUpdatesError,
  recentUpdatesLoading,
  fetchRecentUpdates
}: RecentUpdatesProps) {
  const t = useTranslations('tcgpocket')

  return (
    <div className="bg-surface-800 rounded-xl p-6 h-[50vh] overflow-auto">
      <h2 className="text-2xl font-bold mb-4 text-primary-300">{t('gallery.recentUpdates.title')}</h2>
      <div className="space-y-4">
        {recentUpdatesError ? (
          <div className="flex items-center justify-center text-red-500 bg-red-100 rounded-lg p-4">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{recentUpdatesError}</span>
          </div>
        ) : recentUpdates.length === 0 ? (
          <p className="text-surface-400 text-center">{t('gallery.recentUpdates.noUpdates')}</p>
        ) : (
          <>
            {recentUpdates.map((update) => (
              <div key={update.id} className="flex items-center justify-between py-2 border-b border-surface-700 last:border-b-0">
                <div>
                  <span className="text-white font-medium">{update.cardName}</span>
                  <span className="text-surface-400 ml-2 text-sm">({t(update.expansion)})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${update.count > 0 ? 'text-highlight-500' : 'text-red-500'}`}>
                    {update.count > 0 ? '+' : ''}{update.count}
                  </span>
                  <span className="text-surface-400 text-sm">{new Date(update.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            <Button
              onClick={fetchRecentUpdates}
              variant="ghost"
              disabled={recentUpdatesLoading}
            >
              {recentUpdatesLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="mr-2 h-4 w-4" />
              )}
              {t('gallery.recentUpdates.loadMore')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}