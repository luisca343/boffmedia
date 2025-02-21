"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useGetAchievements } from "@/hooks/events/useGetAchievements"
import type { Achievement } from "@/types/events"
import { AchievementHeader } from "./AchievementHeader"
import { AchievementsList } from "./AchievementsList"
import { AchievementLoadingState } from "./AchievementLoadingState"
import { AchievementErrorState } from "./AchievementErrorState"
import { AchievementCreateDialog } from "./AchievementCreateDialog"
import { AchievementEditDialog } from "./AchievementEditDialog"
import { AchievementDeleteDialog } from "./AchievementDeleteDialog"

export function AchievementsTab() {
  const { achievements, isLoading, error, refetch } = useGetAchievements()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState(false)
  const [isOpenEditDialog, setIsOpenEditDialog] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  const filteredAchievements = achievements
    ? achievements
        .filter((achievement) => 
          selectedEventId ? achievement.eventId === selectedEventId : true
        )
        .filter((achievement) =>
          searchTerm
            ? achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              achievement.description?.toLowerCase().includes(searchTerm.toLowerCase())
            : true
        )
    : []

  const handleCreateSuccess = () => {
    setIsOpenCreateDialog(false)
    refetch()
  }

  const handleEditSuccess = () => {
    setIsOpenEditDialog(false)
    refetch()
  }

  const handleDeleteSuccess = () => {
    setIsOpenDeleteDialog(false)
    refetch()
  }

  if (isLoading) return <AchievementLoadingState />
  if (error) return <AchievementErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <Card className="bg-surface-800 border-surface-700 mb-6 ">
        <AchievementHeader
          totalAchievements={filteredAchievements.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateNew={() => setIsOpenCreateDialog(true)}
          selectedEventId={selectedEventId}
          onEventChange={setSelectedEventId}
        />

        <AchievementsList
          achievements={filteredAchievements}
          onEdit={(achievement) => {
            setSelectedAchievement(achievement)
            setIsOpenEditDialog(true)
          }}
          onDelete={(achievement) => {
            setSelectedAchievement(achievement)
            setIsOpenDeleteDialog(true)
          }}
        />
      </Card>

      <AchievementCreateDialog
        open={isOpenCreateDialog}
        onOpenChange={setIsOpenCreateDialog}
        onSuccess={handleCreateSuccess}
        defaultEventId={selectedEventId}
      />

      {selectedAchievement && (
        <>
          <AchievementEditDialog
            open={isOpenEditDialog}
            onOpenChange={setIsOpenEditDialog}
            achievement={selectedAchievement}
            onSuccess={handleEditSuccess}
          />

          <AchievementDeleteDialog
            open={isOpenDeleteDialog}
            onOpenChange={setIsOpenDeleteDialog}
            achievement={selectedAchievement}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  )
}

