"use client"

import { useTranslations } from "next-intl"
import { Avatar, Badge, Card } from "../ui"
import { STANDING } from "../../_utils/tones"
import { townName } from "../../_utils/format"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import type { Ciudadano } from "../../_types"

// The censo card: identity, residence, civic standing and land holdings. `level`, `role`,
// `balance`, `online` and `joinedAt` do not exist here — playtime lives in Minecraft NBT,
// this read has no wallet column, and presence is not tracked — so they are omitted
// rather than faked.
export function CiudadanoCard({ citizen }: { citizen: Ciudadano }) {
  const t = useTranslations("gobierno")
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
        <div className="mb-2.5 flex items-center gap-[0.6875rem]">
          <Avatar user={citizen.username} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-gt-display text-[0.9375rem] font-bold text-gt-ink-900">
                {citizen.username}
              </span>
              {citizen.buscado && (
                <Badge tone="danger" icon="alert" solid>
                  {t("poblacion.buscadoBadge")}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 font-gt-mono text-[0.625rem] uppercase tracking-[.08em] text-gt-ink-400">
              {firstTown ? townName(firstTown) : t("poblacion.sinResidencia")}
              {restTowns.length > 0 && ` +${restTowns.length}`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gt-line-soft pt-2.5">
          <Badge tone={standing.tone}>{t(standing.labelKey)}</Badge>
          <div className="flex items-center gap-3">
            <span className="flex items-baseline gap-1">
              <span className="font-gt-display text-sm font-bold tabular-nums text-gt-ink-900">
                {citizen.parcelas}
              </span>
              <span className="font-gt-mono text-[0.5625rem] uppercase tracking-[.08em] text-gt-ink-400">
                {t("poblacion.parcelasUnit")}
              </span>
            </span>
            {citizen.multasPendientes > 0 && (
              <span className="flex items-baseline gap-1">
                <span className="font-gt-display text-sm font-bold tabular-nums text-gt-warn">
                  {citizen.multasPendientes}
                </span>
                <span className="font-gt-mono text-[0.5625rem] uppercase tracking-[.08em] text-gt-ink-400">
                  {t("poblacion.multasUnit")}
                </span>
              </span>
            )}
          </div>
        </div>
      </button>
    </Card>
  )
}
