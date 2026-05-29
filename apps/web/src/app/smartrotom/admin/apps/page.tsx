"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Minus, RefreshCw, User as UserIcon, AlertTriangle, LayoutGrid } from "lucide-react"
import { AppsService } from "@/services/api/smartrotom/appsService"
import { App } from "@/components/smartrotom/apps/App"
import { useBoffSession } from "@/services/useBoffSession"
import { UsersService } from "@/services/api/smartrotom/usersService"
import { SmartRotomApp } from "@boffmedia/shared"

type User = { id: number; uuid: string; username?: string }

export default function PlayerAppManagement() {
  const { session } = useBoffSession()
  const [selectedPlayerUuid, setSelectedPlayerUuid] = useState<string>("")
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)

  useEffect(() => {
    setUsersLoading(true)
    UsersService.findAll()
      .then((res: any) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          setAllUsers(res.data)
        } else {
          setUsersError("No se pudieron cargar los usuarios.")
        }
      })
      .catch(() => setUsersError("Error al cargar usuarios."))
      .finally(() => setUsersLoading(false))
  }, [])

  useEffect(() => {
    if (session?.user?.smartRotomUser?.uuid && !selectedPlayerUuid) {
      setSelectedPlayerUuid(session.user.smartRotomUser.uuid)
    }
  }, [session, selectedPlayerUuid])

  const [playerApps, setPlayerApps] = useState<SmartRotomApp[]>([])
  const [allApps, setAllApps] = useState<SmartRotomApp[]>([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [appsError, setAppsError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const fetchApps = async (playerUuid: string) => {
    setAppsLoading(true)
    setAppsError(null)
    try {
      const [allRes, playerRes] = await Promise.all([
        AppsService.findAll(),
        playerUuid ? AppsService.getForPlayer(playerUuid) : Promise.resolve({ statusCode: 200, data: [] })
      ])
      if (allRes.statusCode === 200 && Array.isArray(allRes.data)) setAllApps(allRes.data)
      else setAppsError("No se pudieron cargar las apps.")
      if (playerRes.statusCode === 200 && Array.isArray(playerRes.data)) setPlayerApps(playerRes.data)
      else { setPlayerApps([]); if (playerUuid) setAppsError("No se pudieron cargar las apps del jugador.") }
    } catch { setAppsError("Error al cargar apps.") } 
    finally { setAppsLoading(false) }
  }

  useEffect(() => {
    if (selectedPlayerUuid) fetchApps(selectedPlayerUuid)
    else { setPlayerApps([]); setAllApps([]) }
  }, [selectedPlayerUuid])

  const { extraApps, availableApps } = useMemo(() => {
    if (!allApps || !playerApps || !selectedPlayerUuid) return { extraApps: [], availableApps: [] }
    const playerAppIds = new Set(playerApps.map((app: SmartRotomApp) => app.id))
    return {
      extraApps: allApps.filter((app: SmartRotomApp) => app.active === 1 && playerAppIds.has(app.id)),
      availableApps: allApps.filter((app: SmartRotomApp) => app.active === 1 && !playerAppIds.has(app.id)),
    }
  }, [allApps, playerApps, selectedPlayerUuid])

  const handleAddApp = async (appId: number) => {
    if (!selectedPlayerUuid) return
    setIsAdding(true)
    try {
      const res = await AppsService.addAppToPlayer(selectedPlayerUuid, appId)
      if (res.statusCode === 200) await fetchApps(selectedPlayerUuid)
      else setAppsError("No se pudo añadir la app.")
    } catch { setAppsError("Error al añadir la app.") } 
    finally { setIsAdding(false) }
  }

  const handleRemoveApp = async (appId: number) => {
    if (!selectedPlayerUuid) return
    setIsRemoving(true)
    try {
      const res = await AppsService.removeAppFromPlayer(selectedPlayerUuid, appId)
      if (res.statusCode === 200) await fetchApps(selectedPlayerUuid)
      else setAppsError("No se pudo eliminar la app.")
    } catch { setAppsError("Error al eliminar la app.") } 
    finally { setIsRemoving(false) }
  }

  const getPlayerName = () => {
    if (!selectedPlayerUuid || !allUsers.length) return "Ninguno"
    const user = allUsers.find(u => u.uuid === selectedPlayerUuid)
    return user ? user.username || `Usuario ${user.id}` : "Desconocido"
  }

  if (usersLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="sr-spin" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )

  if (usersError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="sr-banner sr-crit"><AlertTriangle size={14} /> {usersError}</div>
    </div>
  )

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><LayoutGrid size={20} /> Gestor de Apps</h1>
        <p className="sr-page-sub">Asigna y elimina aplicaciones de SmartRotom para cada jugador</p>
      </div>

      <div className="sr-panel" style={{ marginBottom: 'var(--gap)' }}>
        <div className="sr-panel-head">
          <span className="sr-ttl"><UserIcon size={14} /> Seleccionar jugador</span>
          <div className="sr-meta">
            <button className="sr-btn sr-sm sr-ghost" onClick={() => selectedPlayerUuid && fetchApps(selectedPlayerUuid)}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        <div className="sr-panel-body">
          <div className="sr-row">
            <select
              className="sr-select"
              style={{ maxWidth: 360 }}
              value={selectedPlayerUuid}
              onChange={e => setSelectedPlayerUuid(e.target.value)}
            >
              <option value="">Seleccionar jugador…</option>
              {allUsers.filter(u => u.id > 0).map(u => (
                <option key={u.uuid} value={u.uuid}>{u.username || `Usuario ${u.id}`}</option>
              ))}
            </select>
            {selectedPlayerUuid && (
              <div className="sr-badge sr-ok">
                <span className="sr-ledot" />
                {getPlayerName()}
              </div>
            )}
          </div>
          {appsError && (
            <div className="sr-banner sr-crit" style={{ marginTop: 10 }}>
              <AlertTriangle size={14} /> {appsError}
            </div>
          )}
        </div>
      </div>

      {selectedPlayerUuid && (
        <div className="sr-grid2" style={{ alignItems: 'start' }}>
          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Apps del jugador</span>
              <span className="sr-meta">{extraApps.length} apps</span>
            </div>
            <div className="sr-panel-body">
              {appsLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><span className="sr-spin" /></div>
              ) : extraApps.length === 0 ? (
                <div className="sr-empty">
                  <div className="sr-ic"><LayoutGrid size={28} /></div>
                  <div className="sr-t">Sin apps extra asignadas</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 }}>
                  {extraApps.map(app => (
                    <div key={app.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <App app={app as SmartRotomApp} withLink={false} size="small" />
                      <button
                        className="sr-btn sr-danger sr-sm"
                        onClick={() => handleRemoveApp(app.id)}
                        disabled={isRemoving}
                      >
                        <Minus size={12} /> Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Apps disponibles</span>
              <span className="sr-meta">{availableApps.length} apps</span>
            </div>
            <div className="sr-panel-body">
              {appsLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><span className="sr-spin" /></div>
              ) : availableApps.length === 0 ? (
                <div className="sr-empty">
                  <div className="sr-ic"><LayoutGrid size={28} /></div>
                  <div className="sr-t">Todas las apps ya asignadas</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 }}>
                  {availableApps.map(app => (
                    <div key={app.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <App app={app as SmartRotomApp} withLink={false} size="small" />
                      <button
                        className="sr-btn sr-solid sr-sm"
                        onClick={() => handleAddApp(app.id)}
                        disabled={isAdding}
                      >
                        <Plus size={12} /> Añadir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
