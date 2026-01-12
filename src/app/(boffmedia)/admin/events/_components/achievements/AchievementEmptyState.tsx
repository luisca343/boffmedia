"use client"

import { Button } from "@/components/ui/primitives/button"
import { useTranslations } from "next-intl"
import { Award } from "lucide-react"

interface AchievementEmptyStateProps {
  searchTerm?: string
  onClearSearch?: () => void
}

export function AchievementEmptyState({ searchTerm, onClearSearch }: AchievementEmptyStateProps) {
  const t = useTranslations('boffmedia')
  return (
    <div className="text-center py-12 text-surface-300">
      <Award className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
      <h3 className="text-xl font-medium text-surface-200 mb-2">{t('admin.achievements.empty.noAchievements')}</h3>
      <p className="max-w-md mx-auto">
        {searchTerm
          ? t('admin.achievements.empty.noAchievementsDesc')
          : t('admin.achievements.empty.noAchievementsDesc')}
      </p>
      {searchTerm && onClearSearch && (
        <Button variant="outline" className="mt-4 border-primary-500 text-primary-500" onClick={onClearSearch}>
          {t('admin.achievements.empty.clearSearch')}
        </Button>
      )}
    </div>
  )
}

