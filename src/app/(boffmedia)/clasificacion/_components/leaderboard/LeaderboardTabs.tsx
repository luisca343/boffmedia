import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralLeaderboard } from "./GeneralLeaderboard"
import { MedalsLeaderboard } from "./MedalsLeaderboard"
import { AchievementsLeaderboard } from "./AchievementsLeaderboard"
import type { LeaderboardEntry } from "@/types/events"

type LeaderboardTabsProps = {
  currentPlayers: LeaderboardEntry[]
  getPlayerRank: (playerId: number) => number | string
  calculateTotalScore: (player: LeaderboardEntry) => number
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredPlayers: LeaderboardEntry[]
  currentPage: number
  playersPerPage: number
}

export function LeaderboardTabs({
  currentPlayers,
  getPlayerRank,
  calculateTotalScore,
  searchTerm,
  setSearchTerm,
  filteredPlayers,
  currentPage,
  playersPerPage,
}: LeaderboardTabsProps) {
  return (
    <Tabs defaultValue="general" className="mb-6">
      <TabsList className="bg-surface-700">
        <TabsTrigger value="general" className="data-[state=active]:bg-primary-500">
          Puntuación General
        </TabsTrigger>
        <TabsTrigger value="medals" className="data-[state=active]:bg-primary-500">
          Medallas
        </TabsTrigger>
        <TabsTrigger value="achievements" className="data-[state=active]:bg-primary-500">
          Logros
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-4">
        <GeneralLeaderboard
          currentPlayers={currentPlayers}
          getPlayerRank={getPlayerRank}
          calculateTotalScore={calculateTotalScore}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </TabsContent>

      <TabsContent value="medals" className="mt-4">
        <MedalsLeaderboard
          currentPlayers={currentPlayers}
          getPlayerRank={getPlayerRank}
          filteredPlayers={filteredPlayers}
          currentPage={currentPage}
          playersPerPage={playersPerPage}
        />
      </TabsContent>

      <TabsContent value="achievements" className="mt-4">
        <AchievementsLeaderboard
          currentPlayers={currentPlayers}
          getPlayerRank={getPlayerRank}
          filteredPlayers={filteredPlayers}
          currentPage={currentPage}
          playersPerPage={playersPerPage}
        />
      </TabsContent>
    </Tabs>
  )
}

