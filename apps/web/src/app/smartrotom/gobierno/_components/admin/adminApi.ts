"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AppsService } from "@/services/api/smartrotom/appsService"
import { UsersService } from "@/services/api/smartrotom/usersService"
import { NotificationsService, type SendNotificationPayload } from "@/services/api/smartrotom/notificationsService"
import type { ApiResponse } from "@/services/boffAPI"
import type { SmartRotomApp, SmartRotomUser } from "@boffmedia/shared"
import { toast } from "../ui"

/**
 * Jugadores, Apps de jugador and Notificaciones predate the Gobierno API and still talk
 * to the original SmartRotom services directly — there is no /gobierno endpoint for the
 * player/app/notification catalog. `ApiResponse` fails the same way `unwrap` in
 * `_hooks/queries.ts` guards against: a `success: false` envelope must throw, or
 * TanStack Query would treat a failed call as a quietly-empty success.
 */
function unwrapAdmin<T>(res: ApiResponse<T>): T {
  if (res?.success === false || (res?.statusCode && res.statusCode >= 400)) {
    throw new Error(res?.error || res?.message || "La solicitud ha fallado.")
  }
  return res.data as T
}

export const adminKeys = {
  users: ["admin", "users"] as const,
  apps: ["admin", "apps"] as const,
  playerApps: (uuid: string) => ["admin", "apps", "player", uuid] as const,
}

export const useAdminUsers = () =>
  useQuery({
    queryKey: adminKeys.users,
    queryFn: async () => unwrapAdmin(await UsersService.findAll()),
  })

export const useAdminApps = () =>
  useQuery({
    queryKey: adminKeys.apps,
    queryFn: async () => unwrapAdmin(await AppsService.findAll()),
  })

export const useAdminPlayerApps = (uuid: string | null) =>
  useQuery({
    queryKey: adminKeys.playerApps(uuid ?? ""),
    queryFn: async () => unwrapAdmin(await AppsService.getForPlayer(uuid as string)),
    enabled: !!uuid,
  })

export const useAdminAddApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, id }: { uuid: string; id: number }) =>
      unwrapAdmin(await AppsService.addAppToPlayer(uuid, id)),
    onSuccess: (_d, { uuid }) => {
      qc.invalidateQueries({ queryKey: adminKeys.playerApps(uuid) })
      toast("App añadida al dispositivo", "ok", "plus")
    },
    onError: (e: Error) => toast(e.message, "danger", "alert"),
  })
}

export const useAdminRemoveApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ uuid, id }: { uuid: string; id: number }) =>
      unwrapAdmin(await AppsService.removeAppFromPlayer(uuid, id)),
    onSuccess: (_d, { uuid }) => {
      qc.invalidateQueries({ queryKey: adminKeys.playerApps(uuid) })
      toast("App eliminada", "default", "minus")
    },
    onError: (e: Error) => toast(e.message, "danger", "alert"),
  })
}

export const useSendNotification = () =>
  useMutation({
    mutationFn: async (payload: SendNotificationPayload) =>
      unwrapAdmin(await NotificationsService.sendNotification(payload)),
    onSuccess: () => toast("Notificación enviada", "ok", "bell"),
    onError: (e: Error) => toast(e.message, "danger", "alert"),
  })

export type { SmartRotomApp, SmartRotomUser }
