"use client"

import { useTranslations } from "next-intl"
import { Avatar, Badge, Button, Card } from "../ui"
import { getAnuncioKindMeta } from "./anuncioMeta"
import { fmtDate, townName } from "../../_utils/format"
import { useFormat } from "@/lib/useFormat"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useOfficer } from "../../_hooks/useOfficer"
import type { Anuncio } from "../../_types"

export function AnuncioCard({
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
    <Card className="p-[15px]">
      <div className="mb-2 flex items-center gap-2">
        <Badge tone={km.tone} icon={km.icon}>
          {km.label}
        </Badge>
        <span className="ml-auto font-gt-mono text-[10px] text-gt-ink-400">{fmtDate(anuncio.publishedAt, intlLocale)}</span>
      </div>
      <h3 className="mb-1.5 font-gt-display text-[17px] leading-tight text-gt-ink-900">{anuncio.title}</h3>
      <p className="line-clamp-4 text-[12.5px] leading-relaxed text-gt-ink-600">{anuncio.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gt-line-soft pt-2.5">
        <button type="button" onClick={() => openDossier(anuncio.author.uuid)} className="flex items-center gap-2">
          <Avatar user={anuncio.author.username} size={22} />
          <span className="text-[11.5px] text-gt-ink-500">{anuncio.author.username}</span>
        </button>
        {anuncio.town && (
          <span className="ml-auto font-gt-mono text-[10.5px] text-gt-ink-400">{townName(anuncio.town)}</span>
        )}
        {canManage && (
          <div className={`flex items-center gap-1 ${anuncio.town ? "" : "ml-auto"}`}>
            <Button tone="plain" size="sm" onClick={onEdit}>
              {t("anuncios.editar")}
            </Button>
            <Button tone="plain" size="sm" icon="trash" onClick={onDelete} disabled={deleting} aria-label={t("anuncios.retirar")} />
          </div>
        )}
      </div>
    </Card>
  )
}
