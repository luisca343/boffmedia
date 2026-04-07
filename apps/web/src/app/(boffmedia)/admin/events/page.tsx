"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs"
import { Gamepad2, Calendar, Users, Award } from "lucide-react"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { GamesTab } from "./_components/games/GamesTab"
import { EventsTab } from "./_components/events/EventsTab"
import { AchievementsTab } from "./_components/achievements/AchievementsTab"
import { TeamsTab } from "./_components/teams/TeamsTab"

function AdminDashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("games")

  // Initialize tab from URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    const validTabs = ['games', 'events', 'teams', 'achievements']
    
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-surface-50 mb-2">Panel de Administración</h1>
        <p className="text-surface-300">Gestiona juegos, eventos, equipos y logros del portal.</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-8 bg-surface-800 p-1">
          <TabsTrigger value="games" className="data-[state=active]:bg-primary-500">
            <Gamepad2 className="h-4 w-4 mr-2" />
            Juegos
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-primary-500">
            <Calendar className="h-4 w-4 mr-2" />
            Eventos
          </TabsTrigger>
          
          <TabsTrigger value="teams" className="data-[state=active]:bg-primary-500">
            <Users className="h-4 w-4 mr-2" />
            Equipos
          </TabsTrigger>
        
          <TabsTrigger value="achievements" className="data-[state=active]:bg-primary-500">
            <Award className="h-4 w-4 mr-2" />
            Logros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <GamesTab />
        </TabsContent>

        <TabsContent value="events">
            <EventsTab />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="achievements">
            <AchievementsTab />
        </TabsContent>
      </Tabs>

      <ToastContainer position="bottom-right" theme="dark" className="toastify-dark" />
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}