"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Search, ChevronLeft, ChevronRight, Users, Medal, Filter, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FullLeaderboardComponent() {
  const { leaderboards, error, isLoading, refetch } = useGetLeaderboards()
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'score' | 'medals' | 'achievements'>('score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const playersPerPage = 10

  // Calculate total score including medal points and achievement points
  const calculateTotalScore = (player: any) => {
    return (parseInt(player.medalPoints) || 0) + (parseInt(player.achievementPoints) || 0)
  }

  useEffect(() => {
    if (leaderboards && Array.isArray(leaderboards)) {
      let sorted = [...leaderboards]
      
      // Apply sorting
      sorted.sort((a, b) => {
        const modifier = sortDirection === 'desc' ? -1 : 1
        if (sortBy === 'score') {
          return (calculateTotalScore(a) - calculateTotalScore(b)) * modifier
        }
        return (a[sortBy] - b[sortBy]) * modifier
      })
      
      // Apply search filter if needed
      if (searchTerm) {
        sorted = sorted.filter(player => 
          (player.username || `Player ${player.userId}`).toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setFilteredPlayers(sorted)
      setCurrentPage(1) // Reset to first page when filters change
    }
  }, [leaderboards, searchTerm, sortBy, sortDirection])

  // Calculate pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage)
  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  )

  // Get player rank for the entire leaderboard
  const getPlayerRank = (playerId: number) => {
    if (!leaderboards || !Array.isArray(leaderboards)) return '-'
    
    const sortedLeaderboard = [...leaderboards].sort((a, b) => 
      calculateTotalScore(b) - calculateTotalScore(a)
    )
    const rank = sortedLeaderboard.findIndex(player => player.userId === playerId) + 1
    return rank
  }

  if (isLoading) return (
    <section className="py-16 bg-gradient-to-br from-surface-800 to-surface-900 min-h-[calc(100vh-22rem)]">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
        <p className="mt-4 text-surface-300">Cargando clasificación global...</p>
      </div>
    </section>
  )
  
  if (error) return (
    <section className="py-16 bg-gradient-to-br from-surface-800 to-surface-900 min-h-[calc(100vh-22rem)]">
      <div className="container mx-auto px-4 text-center">
        <div className="text-warning-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
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
            Explora el ranking de todos los jugadores de la comunidad. Compite, gana medallas, logros y asciende en la clasificación.
          </p>
        </div>
        
        <Card className="bg-surface-800 mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-6 w-6 text-primary-500" />
                  <span className="text-lg font-semibold text-primary-500">Ranking Global</span>
                </div>
                <CardTitle className="text-2xl text-surface-50">
                  Tabla de Clasificación
                </CardTitle>
                <CardDescription className="text-surface-300">
                  {filteredPlayers.length} jugadores en la clasificación
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <Input
                    placeholder="Buscar jugador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-surface-700 border-surface-600 text-surface-50"
                  />
                </div>
                
                <Select
                  value={`${sortBy}-${sortDirection}`}
                  onValueChange={(val) => {
                    const [newSortBy, newSortDir] = val.split('-') as ['score' | 'medals' | 'achievements', 'asc' | 'desc']
                    setSortBy(newSortBy)
                    setSortDirection(newSortDir)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-40 bg-surface-700 border-surface-600 text-surface-50">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ordenar por" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-surface-800 border-surface-700">
                    <SelectItem value="score-desc">Mayor puntuación</SelectItem>
                    <SelectItem value="score-asc">Menor puntuación</SelectItem>
                    <SelectItem value="medals-desc">Más medallas</SelectItem>
                    <SelectItem value="medals-asc">Menos medallas</SelectItem>
                    <SelectItem value="achievements-desc">Más logros</SelectItem>
                    <SelectItem value="achievements-asc">Menos logros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="general" className="mb-6">
              <TabsList className="bg-surface-700">
                <TabsTrigger value="general" className="data-[state=active]:bg-primary-500">Puntuación General</TabsTrigger>
                <TabsTrigger value="medals" className="data-[state=active]:bg-primary-500">Medallas</TabsTrigger>
                <TabsTrigger value="achievements" className="data-[state=active]:bg-primary-500">Logros</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="mt-4">
                {currentPlayers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-surface-700">
                          <th className="px-4 py-3 text-left text-surface-300 font-medium">Posición</th>
                          <th className="px-4 py-3 text-left text-surface-300 font-medium">Jugador</th>
                          <th className="px-4 py-3 text-right text-surface-300 font-medium">Puntuación Total</th>
                          <th className="px-4 py-3 text-right text-surface-300 font-medium">Medallas</th>
                          <th className="px-4 py-3 text-right text-surface-300 font-medium">Logros</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPlayers.map((player, index) => {
                          const globalRank = getPlayerRank(player.userId)
                          let rankColorClass = 'text-surface-400'
                          let bgColorClass = ''
                          
                          // Special styling for top 3 ranks
                          if (globalRank === 1) {
                            rankColorClass = 'text-warning-500 font-bold'
                            bgColorClass = 'bg-warning-500/5'
                          } else if (globalRank === 2) {
                            rankColorClass = 'text-surface-300 font-bold'
                            bgColorClass = 'bg-surface-300/5'
                          } else if (globalRank === 3) {
                            rankColorClass = 'text-amber-600 font-bold'
                            bgColorClass = 'bg-amber-500/5'
                          }
                          
                          const totalScore = calculateTotalScore(player)
                          
                          return (
                            <tr 
                              key={player.userId} 
                              className={`border-b border-surface-700 hover:bg-surface-700/50 ${bgColorClass}`}
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <span className={`text-xl font-bold ${rankColorClass}`}>
                                    #{globalRank}
                                  </span>
                                  {globalRank <= 3 && (
                                    <Trophy 
                                      className={`ml-2 h-5 w-5 ${
                                        globalRank === 1 ? 'text-warning-500' : 
                                        globalRank === 2 ? 'text-surface-300' : 'text-amber-600'
                                      }`} 
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-surface-600 flex items-center justify-center">
                                    {player.avatar ? (
                                      <img 
                                        src={player.avatar} 
                                        alt={player.username || `Jugador ${player.userId}`} 
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <Users className="h-5 w-5 text-surface-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-surface-50">
                                      {player.username || `Jugador ${player.userId}`}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="font-medium text-surface-50">
                                  {totalScore.toLocaleString()}
                                </span>
                                <div className="text-xs text-surface-400">
                                  <span>Medallas: {player.medalPoints || 0}</span>
                                  <span className="mx-1">•</span>
                                  <span>Logros: {player.achievementPoints || 0}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Medal className="h-5 w-5 text-primary-500" />
                                  <Badge className="bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                    {player.medals || 0}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Award className="h-5 w-5 text-warning-500" />
                                  <Badge className="bg-warning-500/20 text-warning-400 border border-warning-500/30">
                                    {player.achievements || 0}
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-surface-300">
                    <Trophy className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
                    <h3 className="text-xl font-medium text-surface-200 mb-2">No se encontraron jugadores</h3>
                    <p className="max-w-md mx-auto">
                      {searchTerm 
                        ? `No hay jugadores que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.` 
                        : "No hay jugadores en la clasificación todavía. Sé el primero en participar en un evento y ganar puntos."}
                    </p>
                    {searchTerm && (
                      <Button 
                        variant="outline" 
                        className="mt-4 border-primary-500 text-primary-500" 
                        onClick={() => setSearchTerm('')}
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="medals" className="mt-4">
                {currentPlayers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-surface-700">
                          <th className="px-4 py-3 text-left text-surface-300 font-medium">Posición</th>
                          <th className="px-4 py-3 text-left text-surface-300 font-medium">Jugador</th>
                          <th className="px-4 py-3 text-right text-surface-300 font-medium">Medallas</th>
                          <th className="px-4 py-3 text-right text-surface-300 font-medium">Puntos de Medallas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...currentPlayers]
                          .sort((a, b) => (b.medals || 0) - (a.medals || 0))
                          .map((player, index) => {
                            const medalRank = [...filteredPlayers]
                              .sort((a, b) => (b.medals || 0) - (a.medals || 0))
                              .findIndex(p => p.userId === player.userId) + 1 + (currentPage - 1) * playersPerPage;
                            
                            return (
                              <tr 
                                key={player.userId} 
                                className="border-b border-surface-700 hover:bg-surface-700/50"
                              >
                                <td className="px-4 py-4">
                                  <span className="text-xl font-bold text-surface-400">
                                    #{medalRank}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-600 flex items-center justify-center">
                                      {player.avatar ? (
                                        <img 
                                          src={player.avatar} 
                                          alt={player.username || `Jugador ${player.userId}`} 
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <Users className="h-5 w-5 text-surface-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-surface-50">
                                        {player.username || `Jugador ${player.userId}`}
                                      </p>
                                      <p className="text-sm text-surface-400">
                                        Posición General: #{getPlayerRank(player.userId)}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Medal className="h-5 w-5 text-primary-500" />
                                    <Badge className="bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                      {player.medals || 0}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <span className="font-medium text-surface-50">
                                    {player.medalPoints?.toLocaleString() || 0}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-surface-300">
                    <Medal className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
                    <h3 className="text-xl font-medium text-surface-200 mb-2">No hay medallas ganadas todavía</h3>
                    <p className="max-w-md mx-auto">
                      Participa en eventos para ganar medallas y puntos.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="achievements" className="mt-4">
                {currentPlayers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-surface-700">
                          <th className="px-4 py-3 text-left text-surface-300 font-medium">Posición</th>
                          <th className="px-4 py-3 text-left text-surface-300 font-medium">Jugador</th>
                          <th className="px-4 py-3 text-right text-surface-300 font-medium">Logros</th>
                          <th className="px-4 py-3 text-right text-surface-300 font-medium">Puntos de Logros</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...currentPlayers]
                          .sort((a, b) => (b.achievements || 0) - (a.achievements || 0))
                          .map((player, index) => {
                            const achievementRank = [...filteredPlayers]
                              .sort((a, b) => (b.achievements || 0) - (a.achievements || 0))
                              .findIndex(p => p.userId === player.userId) + 1 + (currentPage - 1) * playersPerPage;
                            
                            return (
                              <tr 
                                key={player.userId} 
                                className="border-b border-surface-700 hover:bg-surface-700/50"
                              >
                                <td className="px-4 py-4">
                                  <span className="text-xl font-bold text-surface-400">
                                    #{achievementRank}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-600 flex items-center justify-center">
                                      {player.avatar ? (
                                        <img 
                                          src={player.avatar} 
                                          alt={player.username || `Jugador ${player.userId}`} 
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <Users className="h-5 w-5 text-surface-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-surface-50">
                                        {player.username || `Jugador ${player.userId}`}
                                      </p>
                                      <p className="text-sm text-surface-400">
                                        Posición General: #{getPlayerRank(player.userId)}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Award className="h-5 w-5 text-warning-500" />
                                    <Badge className="bg-warning-500/20 text-warning-400 border border-warning-500/30">
                                      {player.achievements || 0}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <span className="font-medium text-surface-50">
                                    {player.achievementPoints?.toLocaleString() || 0}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-surface-300">
                    <Award className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
                    <h3 className="text-xl font-medium text-surface-200 mb-2">No hay logros desbloqueados todavía</h3>
                    <p className="max-w-md mx-auto">
                      Juega regularmente para desbloquear logros y ganar puntos extra.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Pagination controls */}
            {currentPlayers.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-surface-400 text-sm">
                  Mostrando {(currentPage - 1) * playersPerPage + 1} - {Math.min(currentPage * playersPerPage, filteredPlayers.length)} de {filteredPlayers.length} jugadores
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-surface-600 text-surface-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Calculate page numbers to show based on current page
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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