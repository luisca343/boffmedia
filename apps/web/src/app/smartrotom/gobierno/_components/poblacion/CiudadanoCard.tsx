"use client"

import { Avatar, Badge, Card } from "../ui"
import { STANDING } from "../../_utils/tones"
import { townName } from "../../_utils/format"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import type { Ciudadano } from "../../_types"

// The censo card: identity, residence, civic standing and land holdings. The handoff also
// showed `level`, `role`, `balance`, `online` and `joinedAt` — none of those exist (playtime
// lives in Minecraft NBT, there is no wallet column on this read, and presence isn't
// tracked here), so they are omitted rather than faked.
export function CiudadanoCard({ citizen }: { citizen: Ciudadano }) {
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const standing = STANDING[citizen.standing]
  const [firstTown, ...restTowns] = citizen.towns

  return (
    <Card dep={standing.tone} className="overflow-hidden">
      <button
        type="button"
        onClick={() => openDossier(citizen.uuid)}
        className="block w-full p-3.5 text-left transition-colors hover:bg-gt-paper-1"
      >
        <div className="mb-2.5 flex items-center gap-[11px]">
          <Avatar user={citizen.username} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-gt-display text-[15px] font-bold text-gt-ink-900">
                {citizen.username}
              </span>
              {citizen.buscado && (
                <Badge tone="danger" icon="alert" solid>
                  Buscado
                </Badge>
              )}
            </div>
            <div className="mt-0.5 font-gt-mono text-[10px] uppercase tracking-[.08em] text-gt-ink-400">
              {firstTown ? townName(firstTown) : "Sin residencia"}
              {restTowns.length > 0 && ` +${restTowns.length}`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gt-line-soft pt-2.5">
          <Badge tone={standing.tone}>{standing.label}</Badge>
          <div className="flex items-center gap-3">
            <span className="flex items-baseline gap-1">
              <span className="font-gt-display text-sm font-bold tabular-nums text-gt-ink-900">
                {citizen.parcelas}
              </span>
              <span className="font-gt-mono text-[9px] uppercase tracking-[.08em] text-gt-ink-400">parcelas</span>
            </span>
            {citizen.multasPendientes > 0 && (
              <span className="flex items-baseline gap-1">
                <span className="font-gt-display text-sm font-bold tabular-nums text-gt-warn">
                  {citizen.multasPendientes}
                </span>
                <span className="font-gt-mono text-[9px] uppercase tracking-[.08em] text-gt-ink-400">multas</span>
              </span>
            )}
          </div>
        </div>
      </button>
    </Card>
  )
}
