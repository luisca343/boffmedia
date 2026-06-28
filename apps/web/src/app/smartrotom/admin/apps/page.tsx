
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, Minus, RefreshCw, UserSearch, User as UserIcon, AlertTriangle } from "lucide-react";
import { AppsService } from "@/services/api/smartrotom/appsService";
import { App } from "@/components/smartrotom/apps/App";
import { useBoffSession } from "@/services/useBoffSession";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select";
import { UsersService } from "@/services/api/smartrotom/usersService";
import AdminPageLayout from "../_components/AdminPageLayout";
import TerminalCard from "../_components/TerminalCard";
import TerminalHeader from "../_components/TerminalHeader";
import EmptyState from "../_components/EmptyState";
import { SmartRotomApp } from "@boffmedia/shared";

type User = {
  id: number;
  uuid: string;
  username?: string;
};

export default function PlayerAppManagement() {
  const { session } = useBoffSession();
  const [selectedPlayerUuid, setSelectedPlayerUuid] = useState<string>("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Fetch all users on mount
  useEffect(() => {
    setUsersLoading(true);
    UsersService.findAll()
      .then((res: any) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          setAllUsers(res.data);
        } else {
          setUsersError("No se pudieron cargar los usuarios.");
        }
      })
      .catch(() => setUsersError("Error al cargar usuarios."))
      .finally(() => setUsersLoading(false));
  }, []);

  // Set default selected player to current user if available
  useEffect(() => {
    if (session?.user?.smartRotomUser?.uuid && !selectedPlayerUuid) {
      setSelectedPlayerUuid(session.user.smartRotomUser.uuid);
    }
  }, [session, selectedPlayerUuid]);


  // Local state for apps
  const [playerApps, setPlayerApps] = useState<SmartRotomApp[]>([]);
  const [allApps, setAllApps] = useState<SmartRotomApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch all apps and player apps
  const fetchApps = async (playerUuid: string) => {
    setAppsLoading(true);
    setAppsError(null);
    try {
      const [allRes, playerRes] = await Promise.all([
        AppsService.findAll(),
        playerUuid ? AppsService.getForPlayer(playerUuid) : Promise.resolve({ statusCode: 200, data: [] })
      ]);
      if (allRes.statusCode === 200 && Array.isArray(allRes.data)) {
        setAllApps(allRes.data);
      } else {
        setAppsError("No se pudieron cargar las apps.");
      }
      if (playerRes.statusCode === 200 && Array.isArray(playerRes.data)) {
        setPlayerApps(playerRes.data);
      } else {
        setPlayerApps([]);
        if (playerUuid) setAppsError("No se pudieron cargar las apps del jugador.");
      }
    } catch (e) {
      setAppsError("Error al cargar apps.");
    } finally {
      setAppsLoading(false);
    }
  };

  // Fetch on mount and when player changes
  useEffect(() => {
    if (selectedPlayerUuid) {
      fetchApps(selectedPlayerUuid);
    } else {
      setPlayerApps([]);
      setAllApps([]);
    }
     
  }, [selectedPlayerUuid]);

  // Memoized filtered apps
  const { extraApps, availableApps } = useMemo(() => {
    if (!allApps || !playerApps || !selectedPlayerUuid) return { extraApps: [], availableApps: [] };
    const playerAppIds = new Set(playerApps.map((app: SmartRotomApp) => app.id));
    return {
      extraApps: allApps.filter((app: SmartRotomApp) => app.active === 1 && playerAppIds.has(app.id)),
      availableApps: allApps.filter((app: SmartRotomApp) => app.active === 1 && !playerAppIds.has(app.id)),
    };
  }, [allApps, playerApps, selectedPlayerUuid]);

  // Handlers
  const handleAddApp = async (appId: number) => {
    if (!selectedPlayerUuid) return;
    setIsAdding(true);
    try {
      const res = await AppsService.addAppToPlayer(selectedPlayerUuid, appId);
      if (res.statusCode === 200) {
        await fetchApps(selectedPlayerUuid);
      } else {
        setAppsError("No se pudo añadir la app.");
      }
    } catch {
      setAppsError("Error al añadir la app.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveApp = async (appId: number) => {
    if (!selectedPlayerUuid) return;
    setIsRemoving(true);
    try {
      const res = await AppsService.removeAppFromPlayer(selectedPlayerUuid, appId);
      if (res.statusCode === 200) {
        await fetchApps(selectedPlayerUuid);
      } else {
        setAppsError("No se pudo eliminar la app.");
      }
    } catch {
      setAppsError("Error al eliminar la app.");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRefresh = () => {
    if (selectedPlayerUuid) fetchApps(selectedPlayerUuid);
  };

  const getSelectedPlayerName = () => {
    if (!selectedPlayerUuid || !allUsers.length) return "Ninguno";
    const selectedUser = allUsers.find((user) => user.uuid === selectedPlayerUuid);
    return selectedUser ? selectedUser.username || `Usuario ${selectedUser.id}` : "Desconocido";
  };

  // Loading state
  if (usersLoading || appsLoading) {
    return (
      <div className="w-full min-h-screen bg-black text-warning-hover font-mono p-4 flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="text-warning text-xl mb-2">Cargando sistema...</div>
          <div className="w-40 h-1 bg-warning/30 rounded">
            <div className="h-1 bg-warning rounded animate-[loadingBar_2s_ease-in-out_infinite]" style={{ width: "60%" }}></div>
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
    );
  }

  // Error state
  if (usersError || appsError) {
    return (
      <div className="w-full min-h-screen bg-black text-red-500 font-mono p-4 flex items-center justify-center">
        <div className="border border-red-700 p-4 rounded bg-black/60">
          <div className="text-xl mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Error al cargar datos
          </div>
          <div>{usersError || appsError}</div>
        </div>
      </div>
    );
  }

  return (
    <AdminPageLayout title="Gestor de Apps" version="3.1.2" addBackgroundEffects>
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
              onValueChange={setSelectedPlayerUuid}
            >
              <SelectTrigger className="bg-black text-warning-hover border-warning-border focus:border-warning-border w-full">
                <SelectValue placeholder="Seleccionar jugador" />
              </SelectTrigger>
              <SelectContent className="bg-black text-warning-hover border-warning-border">
                {allUsers && allUsers.length > 0 ? (
                  allUsers
                    .filter((user) => user.id > 0)
                    .map((user) => (
                      <SelectItem
                        key={user.uuid}
                        value={user.uuid}
                        className="hover:bg-warning-soft/30"
                      >
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-2 text-warning" />
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
            variant="highlight"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
        </div>
        {selectedPlayerUuid && (
          <div className="mt-3 text-sm flex items-center">
            <span className="text-warning mr-2">Jugador activo:</span>
            <span className="text-warning-hover font-bold">{getSelectedPlayerName()}</span>
            <span className="ml-2 w-2 h-2 bg-warning rounded-full animate-pulse"></span>
          </div>
        )}
      </TerminalCard>

      {selectedPlayerUuid ? (
        <>
          <TerminalCard
            title="Apps extra del jugador"
            description={`Apps adicionales asignadas a ${getSelectedPlayerName()}`}
            className="mb-6"
          >
            {extraApps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {extraApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col items-center bg-black/40 p-3 border border-warning-border/30 rounded hover:border-warning-border transition-all"
                  >
                    <App app={app as SmartRotomApp} withLink={false} size="small" />
                    <Button
                      onClick={() => handleRemoveApp(app.id)}
                      variant="error"
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

          <TerminalCard
            title="Apps disponibles"
            description="Apps que pueden ser asignadas al jugador"
          >
            {availableApps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {availableApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col items-center bg-black/40 p-3 border border-warning-border/30 rounded hover:border-warning-border transition-all"
                  >
                    <App app={app as SmartRotomApp} withLink={false} size="small" />
                    <Button
                      onClick={() => handleAddApp(app.id)}
                      variant="highlight"
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
  );
}