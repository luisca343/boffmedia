"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { SectionHeader, SectionLoading } from '@/components/boffmedia/sections';
import { LeaderboardFilters } from "../_components/LeaderboardFilters"
import { LeaderboardTabs } from "./_components/leaderboard/LeaderboardTabs"
export default function FullLeaderboardComponent() {
  const { leaderboards, error, isLoading, refetch } = useGetLeaderboards()
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<"score" | "medals" | "achievements">("score")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const playersPerPage = 10

  console.log(leaderboards)



  useEffect(() => {
    if (leaderboards && Array.isArray(leaderboards)) {
      let sorted = [...leaderboards] as any[]

      sorted.sort((a, b) => {
        const modifier = sortDirection === "desc" ? -1 : 1
        if (sortBy === "score") {
          return (Number(a.totalPoints) - Number(b.totalPoints)) * modifier
        }
        if (sortBy === "medals") {
          return ((Number.parseInt(a.medalCount) || 0) - (Number.parseInt(b.medalCount) || 0)) * modifier
        }
        return ((Number.parseInt(a.achievementCount) || 0) - (Number.parseInt(b.achievementCount) || 0)) * modifier
      })

      if (searchTerm) {
        sorted = sorted.filter((player) =>
          (player.nickname || `Player ${player.userId}`).toLowerCase().includes(searchTerm.toLowerCase()),
        )
      }

      setFilteredPlayers(sorted)
      setCurrentPage(1)
    } else {
      setFilteredPlayers([])
    }
  }, [leaderboards, searchTerm, sortBy, sortDirection])

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage)
  const currentPlayers = filteredPlayers.slice((currentPage - 1) * playersPerPage, currentPage * playersPerPage)

  const getPlayerRank = (playerId: number) => {
    if (!leaderboards || !Array.isArray(leaderboards)) return "-"
    const sortedLeaderboard = [...leaderboards].sort((a, b) => Number(b.totalPoints) - Number(a.totalPoints))
    const rank = sortedLeaderboard.findIndex((player) => player.userId === playerId) + 1
    return rank
  }

  if (isLoading)
    return <SectionLoading text="Cargando clasificación..." subtext="Preparando la tabla de posiciones" gradientFrom="from-accent-400" gradientTo="to-indigo-400" />

  if (error)
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-surface-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-surface-400"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Error al cargar la clasificación</h1>
            <p className="text-surface-400 mb-6">{error}</p>
            <Button 
              onClick={refetch} 
              variant="accent"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen">
      <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        <SectionHeader 
          title="Clasificación Global"
          subtitle="Explora el ranking de todos los jugadores de la comunidad. Compite, gana medallas, logros y asciende en la clasificación."
          gradientFrom="from-accent-400"
          gradientTo="to-indigo-400"
        />

        <LeaderboardFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          sortDirection={sortDirection}
          setSortBy={setSortBy}
          setSortDirection={setSortDirection}
          playerCount={filteredPlayers.length}
        />

        {/* Leaderboard Content */}
        <div className="space-y-8">
          <LeaderboardTabs
            currentPlayers={currentPlayers}
            getPlayerRank={getPlayerRank}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredPlayers={filteredPlayers}
            currentPage={currentPage}
            playersPerPage={playersPerPage}
          />

          {/* Pagination */}
          {currentPlayers.length > 0 && (
            <div className="bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-surface-400 text-sm">
                  Mostrando {(currentPage - 1) * playersPerPage + 1} - {Math.min(currentPage * playersPerPage, filteredPlayers.length)} de {filteredPlayers.length} jugadores
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="accentOutline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "accent" : "accentOutline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-surface-500">...</span>
                        <Button
                          variant="accentOutline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="accentOutline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

