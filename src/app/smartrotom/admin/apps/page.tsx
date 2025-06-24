"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Minus, RefreshCw, UserSearch, User as UserIcon, AlertTriangle } from 'lucide-react'
import { useGetAppsForPlayer } from '@/hooks/apps/useGetAppsForPlayer'
import { useAddAppToPlayer } from '@/hooks/apps/useAddAppForPlayer'
import { useRemoveAppFromPlayer } from '@/hooks/apps/useRemoveAppForPlayer'
import { useFindAllApps } from '@/hooks/apps/useFindAllApps'
import { App } from '@/components/smartrotom/App'
import { useBoffSession } from '@/services/useBoffSession'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usersService } from '@/services/api/smartrotom/usersService'

import AdminPageLayout from '../_components/AdminPageLayout'
import TerminalCard from '../_components/TerminalCard'
import TerminalHeader from '../_components/TerminalHeader'
import EmptyState from '../_components/EmptyState'
import { SmartRotomApp } from '@/generated/api'

export default function PlayerAppManagement() {
  const { session } = useBoffSession()
  const [selectedPlayerUuid, setSelectedPlayerUuid] = useState<string>("")
  // TODO: any
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { apps: playerApps, error: playerAppsError, isLoading: playerAppsLoading, refetch: refetchPlayerApps } = useGetAppsForPlayer(selectedPlayerUuid || "")
  const { apps: allApps, error: allAppsError, isLoading: allAppsLoading, refetch: refetchAllApps } = useFindAllApps()
  const { addAppToPlayer, isLoading: isAdding } = useAddAppToPlayer()
  const { removeAppFromPlayer, isLoading: isRemoving } = useRemoveAppFromPlayer()
  const [extraApps, setExtraApps] = useState<SmartRotomApp[]>([])
  const [availableApps, setAvailableApps] = useState<SmartRotomApp[]>([])

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersService.findAll();
        if (response.statusCode === 200) {
          setAllUsers(response.data!);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Set default selected player to current user if available
  useEffect(() => {
    if (session?.user?.smartRotomUser?.uuid && !selectedPlayerUuid) {
      setSelectedPlayerUuid(session.user.smartRotomUser.uuid);
    }
  }, [session, selectedPlayerUuid]);

  // Filter apps when player or apps data changes
  useEffect(() => {
    if (allApps && playerApps && selectedPlayerUuid) {
      const playerAppIds = new Set(playerApps.map(app => app.id))
      setExtraApps(allApps.filter(app => app.active === 0 && playerAppIds.has(app.id)))
      setAvailableApps(allApps.filter(app => app.active === 0 && !playerAppIds.has(app.id)))
    }
  }, [allApps, playerApps, selectedPlayerUuid])

  const handleAddApp = async (appId: number) => {
    if (!selectedPlayerUuid) return;
    await addAppToPlayer(selectedPlayerUuid, appId)
    refetchPlayerApps()
    refetchAllApps()
  }

  const handleRemoveApp = async (appId: number) => {
    if (!selectedPlayerUuid) return;
    await removeAppFromPlayer(selectedPlayerUuid, appId)
    refetchPlayerApps()
    refetchAllApps()
  }

  const handleRefresh = () => {
    refetchPlayerApps()
    refetchAllApps()
  }

  const handlePlayerChange = (uuid: string) => {
    setSelectedPlayerUuid(uuid);
  }

  const getSelectedPlayerName = () => {
    if (!selectedPlayerUuid || !allUsers.length) return "Ninguno";
    const selectedUser = allUsers.find(user => user.uuid === selectedPlayerUuid);
    return selectedUser ? selectedUser.username || "Usuario sin nombre" : "Desconocido";
  }

  if (loading || playerAppsLoading || allAppsLoading) {
    return (
      <div className="w-full min-h-screen bg-black text-green-400 font-mono p-4 flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="text-green-500 text-xl mb-2">Cargando sistema...</div>
          <div className="w-40 h-1 bg-green-700/30 rounded">
            <div className="h-1 bg-green-500 rounded animate-[loadingBar_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
          </div>
        </div>
        <style jsx>{`
          @keyframes loadingBar {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        `}</style>
      </div>
    )
  }

  if (playerAppsError || allAppsError) {
    return (
      <div className="w-full min-h-screen bg-black text-red-500 font-mono p-4 flex items-center justify-center">
        <div className="border border-red-700 p-4 rounded bg-black/60">
          <div className="text-xl mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Error al cargar datos
          </div>
          <div>{playerAppsError || allAppsError}</div>
        </div>
      </div>
    )
  }

  return (
    <AdminPageLayout title="Gestor de Apps" version="3.1.2" addBackgroundEffects={true}>
      {/* Player Selection */}
      <TerminalHeader title="app-manager" username="ficus-labs" />
      <TerminalCard 
        title="Selector de Jugador" 
        description="Seleccione un jugador para gestionar sus apps"
        roundedTop={false}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 items-center">
          <div className="flex-1 w-full">
            <Select 
              value={selectedPlayerUuid} 
              onValueChange={handlePlayerChange}
            >
              <SelectTrigger className="bg-black text-green-400 border-green-700 focus:border-green-500 w-full">
                <SelectValue placeholder="Seleccionar jugador" />
              </SelectTrigger>
              <SelectContent className="bg-black text-green-400 border-green-700">
                {allUsers && allUsers.length > 0 ? (
                  allUsers
                    .filter(user => user.id > 0)
                    .map(user => (
                      <SelectItem 
                        key={user.uuid} 
                        value={user.uuid} 
                        className="hover:bg-green-900/30"
                      >
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-2 text-green-600" />
                          <span>{user.username || `Usuario ${user.id}`}</span>
                        </div>
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="no-users" disabled>No hay usuarios disponibles</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleRefresh} 
            className="bg-green-900/30 hover:bg-green-800/50 text-green-400 border border-green-700 hover:shadow-neon transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
        </div>
        
        {selectedPlayerUuid && (
          <div className="mt-3 text-sm flex items-center">
            <span className="text-green-600 mr-2">Jugador activo:</span>
            <span className="text-green-400 font-bold">{getSelectedPlayerName()}</span>
            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        )}
      </TerminalCard>

      {selectedPlayerUuid ? (
        <>
          {/* User's Extra Apps */}
          <TerminalCard
            title="Apps extra del jugador"
            description={`Apps adicionales asignadas a ${getSelectedPlayerName()}`}
            className="mb-6"
          >
            {extraApps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {extraApps.map(app => (
                  <div key={app.id} className="flex flex-col items-center bg-black/40 p-3 border border-green-900/30 rounded hover:border-green-700 transition-all">
                    <App app={app as SmartRotomApp} withLink={false} size='small'/>
                    <Button
                      onClick={() => handleRemoveApp(app.id)}
                      className="mt-2 bg-red-900/60 hover:bg-red-800 text-red-100 border border-red-700 hover:shadow-[0_0_5px_rgba(220,38,38,0.5)] transition-all"
                      disabled={isRemoving}
                    >
                      <Minus className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<UserSearch className="h-12 w-12" />} 
                message="Este jugador no tiene apps extra asignadas" 
              />
            )}
          </TerminalCard>

          {/* Available Apps */}
          <TerminalCard
            title="Apps disponibles"
            description="Apps que pueden ser asignadas al jugador"
          >
            {availableApps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {availableApps.map(app => (
                  <div key={app.id} className="flex flex-col items-center bg-black/40 p-3 border border-green-900/30 rounded hover:border-green-700 transition-all">
                    <App app={app as SmartRotomApp} withLink={false} size='small'/>
                    <Button
                      onClick={() => handleAddApp(app.id)}
                      className="mt-2 bg-green-900/60 hover:bg-green-800 text-green-100 border border-green-700 hover:shadow-neon transition-all"
                      disabled={isAdding}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Añadir
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No hay más apps disponibles para asignar" />
            )}
          </TerminalCard>
        </>
      ) : (
        <TerminalCard title="Seleccione un Jugador">
          <EmptyState 
            icon={<UserSearch className="h-16 w-16" />}
            title="Seleccione un jugador"
            message="Elija un jugador del menú desplegable para gestionar sus aplicaciones asignadas"
          />
        </TerminalCard>
      )}
    </AdminPageLayout>
  )
}