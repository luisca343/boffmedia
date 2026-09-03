"use client"

import { useTranslations } from "next-intl"
import { USER_ROLES } from "@boffmedia/shared/roles"
import { Avatar, Badge, Button, Card } from "../ui"
import { rankMeta } from "./officerRoles"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useRevokeRole } from "../../_hooks/queries"
import { badgeOf } from "../../_utils/format"
import type { Oficial } from "../../_types"

// No `since` (appointment date) and no `online`: roles carry no grant timestamp and
// there is no presence tracking here, so both are omitted rather than faked.
export function OficialCard({ oficial, isMe, canManage }: { oficial: Oficial; isMe: boolean; canManage: boolean }) {
  const t = useTranslations("gobierno")
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const revoke = useRevokeRole()
  const meta = rankMeta(oficial.rank?.role)
  const rankLabel = meta.labelKey ? t(meta.labelKey) : (meta.label ?? "")

  // Cesar strips the rank they actually hold; an officer with no GOB_* rank only holds the base role.
  const handleCese = () => {
    if (!window.confirm(t("poblacion.cesarConfirm", { username: oficial.username }))) return
    revoke.mutate({ uuid: oficial.uuid, role: oficial.rank?.role ?? USER_ROLES.GOBIERNO })
  }

  return (
    <Card dep={meta.tone} className="p-4">
      <div className="mb-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => openDossier(oficial.uuid)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar user={oficial.username} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-gt-display text-base font-bold text-gt-ink-900">
                {oficial.username}
              </span>
              {isMe && <Badge tone="gold">{t("poblacion.tupBadge")}</Badge>}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={meta.tone}>{rankLabel}</Badge>
              <span className="font-gt-mono text-[0.65625rem] text-gt-ink-400">
                {t("poblacion.placa", { badge: badgeOf(oficial.userId, oficial.rank?.prefix) })}
              </span>
            </div>
          </div>
        </button>
        {canManage && (
          <Button
            tone="ghost"
            size="icon"
            icon="x"
            aria-label={t("poblacion.cesarAriaLabel", { username: oficial.username })}
            title={t("poblacion.cesar")}
            onClick={handleCese}
            disabled={revoke.isPending}
          />
        )}
      </div>

      {oficial.roles.length > 1 && (
        <div className="border-t border-gt-line-soft pt-2.5 font-gt-mono text-[0.625rem] uppercase tracking-[.08em] text-gt-ink-400">
          {t("poblacion.ostentaRoles", { count: oficial.roles.length })}
        </div>
      )}
    </Card>
  )
}
