"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/primitives/card"
import { useGetTeams } from "@/hooks/events/useGetTeams"
import type { EventTeam } from "@/types/events"
import { TeamHeader } from "./TeamHeader"
import { TeamsList } from "./TeamsList"
import { TeamLoadingState } from "./TeamLoadingState"
import { TeamErrorState } from "./TeamErrorState"
import { TeamCreateDialog } from "./TeamCreateDialog"
import { TeamEditDialog } from "./TeamEditDialog"
import { TeamDeleteDialog } from "./TeamDeleteDialog"

export function TeamsTab() {
  const { teams, isLoading, error, refetch } = useGetTeams()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<EventTeam | null>(null)
  const [isOpenCreateDialog, setIsOpenCreateDialog] = useState(false)
  const [isOpenEditDialog, setIsOpenEditDialog] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)

  const filteredTeams = teams
    ? searchTerm
      ? teams.filter(
          (team) =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (team.tag && team.tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : teams
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

  if (isLoading) return <TeamLoadingState />
  if (error) return <TeamErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <Card className="bg-surface-800 border-surface-700 mb-6">
        <TeamHeader
          totalTeams={filteredTeams.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateNew={() => setIsOpenCreateDialog(true)}
        />

        <TeamsList
          teams={filteredTeams}
          onEdit={(team) => {
            setSelectedTeam(team)
            setIsOpenEditDialog(true)
          }}
          onDelete={(team) => {
            setSelectedTeam(team)
            setIsOpenDeleteDialog(true)
          }}
        />
      </Card>

      <TeamCreateDialog
        open={isOpenCreateDialog}
        onOpenChange={setIsOpenCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {selectedTeam && (
        <>
          <TeamEditDialog
            open={isOpenEditDialog}
            onOpenChange={setIsOpenEditDialog}
            team={selectedTeam}
            onSuccess={handleEditSuccess}
          />

          <TeamDeleteDialog
            open={isOpenDeleteDialog}
            onOpenChange={setIsOpenDeleteDialog}
            team={selectedTeam}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  )
}

