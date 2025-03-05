"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import type { LeaderboardEntry } from "@/types/events"
import { LeaderboardHeader } from "./_components/LeaderboardHeader"
import { LeaderboardTabs } from "./_components/leaderboard/LeaderboardTabs"
export default function FullLeaderboardComponent() {
  const { leaderboards, error, isLoading, refetch } = useGetLeaderboards()
  const [filteredPlayers, setFilteredPlayers] = useState<LeaderboardEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<"score" | "medals" | "achievements">("score")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const playersPerPage = 10

  const calculateTotalScore = useCallback((player: any) => {
    return (Number.parseInt(player.medalPoints) || 0) + (Number.parseInt(player.achievementPoints) || 0)
  }, [])

  useEffect(() => {
    if (leaderboards && Array.isArray(leaderboards)) {
      let sorted = [...leaderboards]

      sorted.sort((a, b) => {
        const modifier = sortDirection === "desc" ? -1 : 1
        if (sortBy === "score") {
          return (calculateTotalScore(a) - calculateTotalScore(b)) * modifier
        }
        if (sortBy === "medals") {
          return ((a.medalCount || 0) - (b.medalCount || 0)) * modifier
        }
        return ((a.achievementCount || 0) - (b.achievementCount || 0)) * modifier
      })

      if (searchTerm) {
        sorted = sorted.filter((player) =>
          (player.username || `Player ${player.userId}`).toLowerCase().includes(searchTerm.toLowerCase()),
        )
      }

      setFilteredPlayers(sorted)
      setCurrentPage(1)
    }
  }, [leaderboards, searchTerm, sortBy, sortDirection, calculateTotalScore])

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage)
  const currentPlayers = filteredPlayers.slice((currentPage - 1) * playersPerPage, currentPage * playersPerPage)

  const getPlayerRank = (playerId: number) => {
    if (!leaderboards || !Array.isArray(leaderboards)) return "-"

    const sortedLeaderboard = [...leaderboards].sort((a, b) => calculateTotalScore(b) - calculateTotalScore(a))
    const rank = sortedLeaderboard.findIndex((player) => player.userId === playerId) + 1
    return rank
  }

  if (isLoading)
    return (
      <section className="py-16 bg-gradient-to-br from-surface-800 to-surface-900 min-h-[calc(100vh-22rem)]">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
          <p className="mt-4 text-surface-300">Cargando clasificación global...</p>
        </div>
      </section>
    )

  if (error)
    return (
      <section className="py-16 bg-gradient-to-br from-surface-800 to-surface-900 min-h-[calc(100vh-22rem)]">
        <div className="container mx-auto px-4 text-center">
          <div className="text-warning-500 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </div>
          <p className="text-xl text-surface-300">Error al cargar la clasificación: {error}</p>
          <Button onClick={refetch} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white">
            Reintentar
          </Button>
        </div>
      </section>
    )

  return (
    <section className="py-16 bg-gradient-to-br from-surface-800 to-surface-900 min-h-[calc(100vh-22rem)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-surface-50">Clasificación Global</h1>
          <p className="text-xl text-surface-300 max-w-3xl mx-auto">
            Explora el ranking de todos los jugadores de la comunidad. Compite, gana medallas, logros y asciende en la
            clasificación.
          </p>
        </div>

        <Card className="bg-surface-800 mb-8">
          <LeaderboardHeader
            playerCount={filteredPlayers.length}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            setSortDirection={setSortDirection}
          />

          <CardContent>
            <LeaderboardTabs
              currentPlayers={currentPlayers}
              getPlayerRank={getPlayerRank}
              calculateTotalScore={calculateTotalScore}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredPlayers={filteredPlayers}
              currentPage={currentPage}
              playersPerPage={playersPerPage}
            />

            {currentPlayers.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-surface-400 text-sm">
                  Mostrando {(currentPage - 1) * playersPerPage + 1} -{" "}
                  {Math.min(currentPage * playersPerPage, filteredPlayers.length)} de {filteredPlayers.length} jugadores
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-surface-600 text-surface-300"
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
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-primary-500 text-white"
                              : "border-surface-600 text-surface-300"
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-surface-500">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="border-surface-600 text-surface-300"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="border-surface-600 text-surface-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

