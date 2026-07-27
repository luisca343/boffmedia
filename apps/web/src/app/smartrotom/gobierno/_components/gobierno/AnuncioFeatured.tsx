"use client"

import { useTranslations } from "next-intl"
import { Avatar, Badge, Button, Card, Icon } from "../ui"
import { getAnuncioKindMeta } from "./anuncioMeta"
import { fmtDateTime, townName } from "../../_utils/format"
import { useFormat } from "@/lib/useFormat"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useOfficer } from "../../_hooks/useOfficer"
import type { Anuncio } from "../../_types"

export function AnuncioFeatured({
  anuncio,
  onEdit,
  onDelete,
  deleting = false,
}: {
  anuncio: Anuncio
  onEdit: () => void
  onDelete: () => void
  deleting?: boolean
}) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const officer = useOfficer()
  const kindMeta = getAnuncioKindMeta(t)
  const km = kindMeta[anuncio.kind]
  const canManage = officer.isAdmin || officer.uuid === anuncio.author.uuid

  return (
    <Card dep="gold" edgeGold className="mb-4 overflow-hidden p-0">
      <div className="grid grid-cols-1 sm:[grid-template-columns:180px_1fr]">
        <div
          className="grid min-h-[150px] place-items-center border-b border-gt-line sm:border-b-0 sm:border-r"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgb(var(--gt-paper-2)) 0 12px, rgb(var(--gt-paper-1)) 12px 24px)",
          }}
        >
          <Icon name={km.icon} size={42} className="text-gt-ink-300" />
        </div>
        <div className="p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={km.tone} icon={km.icon}>
              {km.label}
            </Badge>
            <Badge tone="default" dot>
              {t("anuncios.fijado")}
            </Badge>
            <span className="ml-auto flex items-center gap-1 font-gt-mono text-[10.5px] text-gt-ink-400">
              <Icon name="calendar" size={11} />
              {fmtDateTime(anuncio.publishedAt, intlLocale)}
            </span>
          </div>
          <h2 className="mb-2 font-gt-display text-2xl leading-tight text-gt-ink-900">{anuncio.title}</h2>
          <p className="max-w-[640px] text-sm leading-relaxed text-gt-ink-600">{anuncio.body}</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-gt-line-soft pt-3">
            <button
              type="button"
              onClick={() => openDossier(anuncio.author.uuid)}
              className="flex items-center gap-2 text-left"
            >
              <Avatar user={anuncio.author.username} size={26} />
              <span className="text-xs text-gt-ink-600">{t("anuncios.publica", { username: anuncio.author.username })}</span>
            </button>
            {anuncio.town && (
              <Badge tone="default" icon="mapPin">
                {townName(anuncio.town)}
              </Badge>
            )}
            {canManage && (
              <div className="ml-auto flex items-center gap-1.5">
                <Button tone="plain" size="sm" onClick={onEdit}>
                  {t("anuncios.editar")}
                </Button>
                <Button tone="plain" size="sm" icon="trash" onClick={onDelete} disabled={deleting} aria-label={t("anuncios.retirar")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
