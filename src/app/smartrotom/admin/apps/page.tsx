"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus, RefreshCw } from 'lucide-react'
import { App as AppType, OrderedApp } from '@/types/apps'
import { useGetAppsForPlayer } from '@/hooks/apps/useGetAppsForPlayer'
import { useAddAppToPlayer } from '@/hooks/apps/useAddAppForPlayer'
import { useRemoveAppFromPlayer } from '@/hooks/apps/useRemoveAppForPlayer'
import { useFindAllApps } from '@/hooks/apps/useFindAllApps'
import { App } from '@/components/smartrotom/App'
import { useBoffSession } from '@/services/useBoffSession'

export default function PlayerAppManagement() {
  const { session } = useBoffSession()
  const playerUuid = session?.user?.smartRotomUser?.uuid!
  const { apps: playerApps, error: playerAppsError, isLoading: playerAppsLoading, refetch: refetchPlayerApps } = useGetAppsForPlayer(playerUuid)
  const { apps: allApps, error: allAppsError, isLoading: allAppsLoading, refetch: refetchAllApps } = useFindAllApps()
  const { addAppToPlayer, isLoading: isAdding } = useAddAppToPlayer()
  const { removeAppFromPlayer, isLoading: isRemoving } = useRemoveAppFromPlayer()
  const [extraApps, setExtraApps] = useState<AppType[]>([])
  const [availableApps, setAvailableApps] = useState<AppType[]>([])

  useEffect(() => {
    if (allApps && playerApps) {
      const playerAppIds = new Set(playerApps.map(app => app.id))
      setExtraApps(allApps.filter(app => app.active === 0 && playerAppIds.has(app.id)))
      setAvailableApps(allApps.filter(app => app.active === 0 && !playerAppIds.has(app.id)))
    }
  }, [allApps, playerApps])

  const handleAddApp = async (appId: number) => {
    await addAppToPlayer(playerUuid, appId)
    refetchPlayerApps()
    refetchAllApps()
  }

  const handleRemoveApp = async (appId: number) => {
    await removeAppFromPlayer(playerUuid, appId)
    refetchPlayerApps()
    refetchAllApps()
  }

  const handleRefresh = () => {
    refetchPlayerApps()
    refetchAllApps()
  }

  if (playerAppsLoading || allAppsLoading) {
    return <div className="text-green-500">Loading apps...</div>
  }

  if (playerAppsError || allAppsError) {
    return <div className="text-red-500">Error loading apps: {playerAppsError || allAppsError}</div>
  }

  return (
    <div className="w-full min-h-full bg-black text-green-400 font-mono p-4 overflow-auto">
      <Card className="bg-surface-900 border-green-500 border mb-4">
        <CardHeader>
          <CardTitle className="text-green-400 font-bold">Apps extra del jugador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {extraApps.map(app => (
              <div key={app.id} className="flex flex-col items-center">
                <App app={app as OrderedApp} withLink={false} size='small'/>
                <Button
                  onClick={() => handleRemoveApp(app.id)}
                  className="mt-2 bg-red-600 hover:bg-red-700"
                  disabled={isRemoving}
                >
                  <Minus className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-900 border-green-500 border">
        <CardHeader>
          <CardTitle className="text-green-400 font-bold">Apps disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {availableApps.map(app => (
              <div key={app.id} className="flex flex-col items-center">
                <App app={app as OrderedApp} withLink={false} size='small'/>
                <Button
                  onClick={() => handleAddApp(app.id)}
                  className="mt-2 bg-green-600 hover:bg-green-700"
                  disabled={isAdding}
                >
                  <Plus className="w-4 h-4 mr-2" /> Añadir
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-center">
        <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar Apps
        </Button>
      </div>
    </div>
  )
}