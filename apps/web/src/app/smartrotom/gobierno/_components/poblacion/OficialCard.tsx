"use client"

import { USER_ROLES } from "@boffmedia/shared/roles"
import { Avatar, Badge, Button, Card } from "../ui"
import { rankMeta } from "./officerRoles"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useRevokeRole } from "../../_hooks/queries"
import { badgeOf } from "../../_utils/format"
import type { Oficial } from "../../_types"

// The handoff also showed `since` (appointment date) and `online` — neither exists (roles
// carry no grant timestamp, and there is no presence tracking here), so both are omitted.
export function OficialCard({ oficial, isMe, canManage }: { oficial: Oficial; isMe: boolean; canManage: boolean }) {
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const revoke = useRevokeRole()
  const meta = rankMeta(oficial.rank?.role)

  // Cesar strips the rank they actually hold; an officer with no GOB_* rank only holds the base role.
  const handleCese = () => {
    if (!window.confirm(`¿Cesar a ${oficial.username} de su cargo?`)) return
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
              {isMe && <Badge tone="gold">Tú</Badge>}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">
                Placa {badgeOf(oficial.userId, oficial.rank?.prefix)}
              </span>
            </div>
          </div>
        </button>
        {canManage && (
          <Button
            tone="ghost"
            size="icon"
            icon="x"
            aria-label={`Cesar a ${oficial.username}`}
            title="Cesar"
            onClick={handleCese}
            disabled={revoke.isPending}
          />
        )}
      </div>

      {oficial.roles.length > 1 && (
        <div className="border-t border-gt-line-soft pt-2.5 font-gt-mono text-[10px] uppercase tracking-[.08em] text-gt-ink-400">
          Ostenta {oficial.roles.length} roles de gobierno
        </div>
      )}
    </Card>
  )
}
