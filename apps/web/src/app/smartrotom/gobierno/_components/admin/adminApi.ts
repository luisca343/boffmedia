"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { rotomAuthedPOSTOrThrow, rotomGETOrThrow, rotomPOSTOrThrow, userMessageFrom } from "@/services/boffAPI"
import { useApiError } from "@/hooks/useApiError"
import type { SendNotificationPayload } from "@/services/api/smartrotom/notificationsService"
import type { NotificationResponseDto } from "@boffmedia/shared"
import type { RotomApp as SmartRotomApp, RotomUser as SmartRotomUser } from "@boffmedia/shared"
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
    queryFn: () => rotomAuthedPOSTOrThrow<SmartRotomApp[]>("/apps/player", {}),
    enabled: !!uuid,
  })

export const useAdminAddApp = () => {
  const t = useTranslations("gobierno")
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, id }: { uuid: string; id: number }) =>
      rotomAuthedPOSTOrThrow("/apps/player/add", { id }),
    onSuccess: (_d, { uuid }) => {
      qc.invalidateQueries({ queryKey: adminKeys.playerApps(uuid) })
      toast.success(t("apps.appAnadida"))
    },
    onError: (e: unknown) => toast.error(userMessageFrom(e, t("apps.errorAnadir"))),
  })
}

export const useAdminRemoveApp = () => {
  const t = useTranslations("gobierno")
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, id }: { uuid: string; id: number }) =>
      rotomAuthedPOSTOrThrow("/apps/player/remove", { id }),
    onSuccess: (_d, { uuid }) => {
      qc.invalidateQueries({ queryKey: adminKeys.playerApps(uuid) })
      toast.info(t("apps.appEliminada"))
    },
    onError: (e: unknown) => toast.error(userMessageFrom(e, t("apps.errorEliminar"))),
  })
}

export const useSendNotification = () => {
  const t = useTranslations("gobierno")
  return useMutation({
    mutationFn: (payload: SendNotificationPayload) =>
      rotomPOSTOrThrow<NotificationResponseDto>("/notifications/send", payload),
    onSuccess: () => toast.success(t("notificaciones.notifEnviada")),
    onError: (e: unknown) => toast.error(userMessageFrom(e, t("notificaciones.errorEnviar"))),
  })
}

/**
 * Move a player to a taxi stop. A moderation action, not a trip: no fare, no ledger row, and it
 * never shows up in the player's passport. The API audits it and whispers the player.
 *
 * `rotomAuthedPOSTOrThrow`, not `rotomPOSTOrThrow`: the route is role-gated behind
 * JwtAuthGuard + RolesGuard, and the plain helper sends no Bearer.
 */
export const useAdminTeleport = () => {
  const t = useTranslations("gobierno")
  const apiError = useApiError()
  return useMutation({
    mutationFn: (payload: { uuid: string; stopId: string; reason?: string }) =>
      rotomAuthedPOSTOrThrow<void>("/taxi/admin/teleport", payload),
    onSuccess: () => toast.success(t("traslado.trasladado")),
    onError: (e: unknown) => toast.error(apiError(e, t("traslado.errorTrasladar"))),
  })
}

export type { SmartRotomApp, SmartRotomUser }
