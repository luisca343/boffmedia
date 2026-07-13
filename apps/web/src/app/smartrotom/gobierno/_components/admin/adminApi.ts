"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { rotomGETOrThrow, rotomPOSTOrThrow, userMessageFrom } from "@/services/boffAPI"
import type { SendNotificationPayload } from "@/services/api/smartrotom/notificationsService"
import type { NotificationResponseDto } from "@boffmedia/shared"
import type { SmartRotomApp, SmartRotomUser } from "@boffmedia/shared"
import { toast } from "../ui"

/**
 * Jugadores, Apps de jugador and Notificaciones predate the Gobierno API and still talk
 * to the original SmartRotom endpoints directly — there is no /gobierno endpoint for the
 * player/app/notification catalog.
 */
export const adminKeys = {
  users: ["admin", "users"] as const,
  apps: ["admin", "apps"] as const,
  playerApps: (uuid: string) => ["admin", "apps", "player", uuid] as const,
}

export const useAdminUsers = () =>
  useQuery({
    queryKey: adminKeys.users,
    queryFn: () => rotomGETOrThrow<SmartRotomUser[]>("/users"),
  })

export const useAdminApps = () =>
  useQuery({
    queryKey: adminKeys.apps,
    queryFn: () => rotomGETOrThrow<SmartRotomApp[]>("/apps"),
  })

export const useAdminPlayerApps = (uuid: string | null) =>
  useQuery({
    queryKey: adminKeys.playerApps(uuid ?? ""),
    queryFn: () => rotomPOSTOrThrow<SmartRotomApp[]>("/apps/player", { uuid }),
    enabled: !!uuid,
  })

export const useAdminAddApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, id }: { uuid: string; id: number }) =>
      rotomPOSTOrThrow("/apps/player/add", { uuid, id }),
    onSuccess: (_d, { uuid }) => {
      qc.invalidateQueries({ queryKey: adminKeys.playerApps(uuid) })
      toast.success("App añadida al dispositivo")
    },
    onError: (e: unknown) => toast.error(userMessageFrom(e, "No se pudo añadir la app")),
  })
}

export const useAdminRemoveApp = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, id }: { uuid: string; id: number }) =>
      rotomPOSTOrThrow("/apps/player/remove", { uuid, id }),
    onSuccess: (_d, { uuid }) => {
      qc.invalidateQueries({ queryKey: adminKeys.playerApps(uuid) })
      toast.info("App eliminada")
    },
    onError: (e: unknown) => toast.error(userMessageFrom(e, "No se pudo eliminar la app")),
  })
}

export const useSendNotification = () =>
  useMutation({
    mutationFn: (payload: SendNotificationPayload) =>
      rotomPOSTOrThrow<NotificationResponseDto>("/notifications/send", payload),
    onSuccess: () => toast.success("Notificación enviada"),
    onError: (e: unknown) => toast.error(userMessageFrom(e, "No se pudo enviar la notificación")),
  })

export type { SmartRotomApp, SmartRotomUser }
