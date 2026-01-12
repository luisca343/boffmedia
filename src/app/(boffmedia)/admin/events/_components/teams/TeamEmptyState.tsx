"use client"

import { Button } from "@/components/ui/primitives/button"
import { Users } from "lucide-react"
import { useTranslations } from "next-intl"

interface TeamEmptyStateProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function TeamEmptyState({ searchTerm, onClearSearch }: TeamEmptyStateProps) {
  const t = useTranslations('boffmedia')
  
  return (
    <div className="text-center py-12 text-surface-300">
      <Users className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
      <h3 className="text-xl font-medium text-surface-200 mb-2">{t('admin.teams.empty.noTeams')}</h3>
      <p className="max-w-md mx-auto">
        {searchTerm
          ? t('admin.teams.empty.noTeamsSearch', { searchTerm })
          : t('admin.teams.empty.noTeamsDesc')}
      </p>
      {searchTerm && onClearSearch && (
        <Button variant="outline" className="mt-4 border-primary-500 text-primary-500" onClick={onClearSearch}>
          {t('admin.teams.empty.clearSearch')}
        </Button>
      )}
    </div>
  )
}

