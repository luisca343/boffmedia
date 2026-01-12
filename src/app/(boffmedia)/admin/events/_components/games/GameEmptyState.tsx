"use client"

import { Button } from "@/components/ui/primitives/button"
import { Gamepad } from "lucide-react"
import { useTranslations } from "next-intl"

interface GameEmptyStateProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function GameEmptyState({ searchTerm, onClearSearch }: GameEmptyStateProps) {
  const t = useTranslations('boffmedia')
  
  return (
    <div className="text-center py-12 text-surface-300">
      <Gamepad className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
      <h3 className="text-xl font-medium text-surface-200 mb-2">{t('admin.games.empty.noGames')}</h3>
      <p className="max-w-md mx-auto">
        {searchTerm
          ? t('admin.games.empty.noGamesSearch', { searchTerm })
          : t('admin.games.empty.noGamesDesc')}
      </p>
      {searchTerm && onClearSearch && (
        <Button variant="outline" className="mt-4 border-primary-500 text-primary-500" onClick={onClearSearch}>
          {t('admin.games.empty.clearSearch')}
        </Button>
      )}
    </div>
  )
}

