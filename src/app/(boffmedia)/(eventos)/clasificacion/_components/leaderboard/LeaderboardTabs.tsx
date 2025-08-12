import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralLeaderboard } from "./GeneralLeaderboard"
import { MedalsLeaderboard } from "./MedalsLeaderboard"
import { AchievementsLeaderboard } from "./AchievementsLeaderboard"
import { LeaderboardEntry } from "@/generated/api"

type LeaderboardTabsProps = {
  currentPlayers: LeaderboardEntry[]
  getPlayerRank: (playerId: number) => number | string
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredPlayers: LeaderboardEntry[]
  currentPage: number
  playersPerPage: number
}

export function LeaderboardTabs({
  currentPlayers,
  getPlayerRank,
  searchTerm,
  setSearchTerm,
  filteredPlayers,
  currentPage,
  playersPerPage,
}: LeaderboardTabsProps) {
  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 p-1">
        <TabsTrigger 
          value="general" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-surface-300"
        >
          Puntuación General
        </TabsTrigger>
        <TabsTrigger 
          value="medals" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-surface-300"
        >
          Medallas
        </TabsTrigger>
        <TabsTrigger 
          value="achievements" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-surface-300"
        >
          Logros
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <GeneralLeaderboard
          currentPlayers={currentPlayers}
          getPlayerRank={getPlayerRank}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </TabsContent>

      <TabsContent value="medals" className="space-y-4">
        <MedalsLeaderboard
          currentPlayers={currentPlayers}
          getPlayerRank={getPlayerRank}
          filteredPlayers={filteredPlayers}
          currentPage={currentPage}
          playersPerPage={playersPerPage}
        />
      </TabsContent>

      <TabsContent value="achievements" className="space-y-4">
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

