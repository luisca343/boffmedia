"use client"

import { CardContent } from "@/components/ui/primitives/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import { useTranslations } from "next-intl"
import type { Achievement } from "@/types/events"
import { AchievementCard } from "./AchievementCard"
import { AchievementEmptyState } from "./AchievementEmptyState"

interface AchievementsListProps {
  achievements: Achievement[]
  onEdit: (achievement: Achievement) => void
  onDelete: (achievement: Achievement) => void
}

export function AchievementsList({ achievements, onEdit, onDelete }: AchievementsListProps) {
  const t = useTranslations('boffmedia')
  if (achievements.length === 0) {
    return (
      <CardContent>
        <AchievementEmptyState />
      </CardContent>
    )
  }

  return (
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-surface-700">
              <TableHead className="text-surface-300">{t('admin.achievements.table.id')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.achievements.table.achievement')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.achievements.table.event')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.achievements.table.pointsRarity')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.achievements.table.typeCategory')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.achievements.table.completed')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.achievements.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onEdit={() => onEdit(achievement)}
                onDelete={() => onDelete(achievement)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

