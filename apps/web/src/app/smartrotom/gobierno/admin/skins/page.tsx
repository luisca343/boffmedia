"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Button,
  Card,
  Icon,
  PageHead,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableSkeleton,
} from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { NpcSkinModal } from "../../_components/admin/NpcSkinModal"
import { useNpcSkins } from "../../_hooks/queries"
import type { NpcSkin } from "../../_types"

// mc-heads.net renders on demand from the skin name — a real external service, not a
// stored asset, so there is nothing to fake here even though the render itself is remote.
function RenderThumb({ skin, kind, ok, size }: { skin: string; kind: "face" | "head" | "body"; ok: boolean; size: number }) {
  const [failed, setFailed] = useState(false)
  if (!ok || failed) {
    return (
      <div
        className="grid place-items-center rounded-gt-sm border border-dashed border-gt-line-strong bg-gt-paper-2"
        style={{ width: size, height: size }}
      >
        <Icon name="x" size={12} className="text-gt-ink-300" />
      </div>
    )
  }
  const url =
    kind === "face"
      ? `https://mc-heads.net/avatar/${encodeURIComponent(skin)}/${size * 2}`
      : kind === "head"
        ? `https://mc-heads.net/head/${encodeURIComponent(skin)}/${size * 2}`
        : `https://mc-heads.net/body/${encodeURIComponent(skin)}/${size * 2}`
  return (
     
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      onError={() => setFailed(true)}
      className="block rounded-[4px] bg-gt-paper-2 [image-rendering:pixelated]"
    />
  )
}

export default function SkinsPage() {
  const t = useTranslations("gobierno")
  const { data: skins, isLoading } = useNpcSkins()
  const [editing, setEditing] = useState<NpcSkin | null>(null)
  const [creating, setCreating] = useState(false)

  const pending = (skins ?? []).filter((x) => !(x.src && x.face && x.head && x.body)).length

  return (
    <>
      <PageHead
        kicker={t("skins.kicker")}
        dep="urbanismo"
        title={t("skins.title")}
        sub={t("skins.sub")}
      />
      <ConsolaHero
        title={t("skins.heroTitle")}
        code="skins"
        icon="eye"
        dep="urbanismo"
        status={pending ? t("skins.pendientes", { count: pending }) : t("skins.alDia")}
        statusTone={pending ? "warn" : "ok"}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-gt-line p-3.5">
          <Button size="sm" icon="plus" onClick={() => setCreating(true)}>
            {t("skins.nuevaSkin")}
          </Button>
          <span className="ml-auto font-gt-mono text-[11px] text-gt-ink-400">
            {t("skins.skinsUnicas", { count: skins?.length ?? 0 })}
          </span>
        </div>

        {isLoading ? (
          <TableSkeleton cols={5} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("skins.skinNpcs")}</TH>
                <TH className="text-center">{t("skins.face")}</TH>
                <TH className="text-center">{t("skins.cabeza")}</TH>
                <TH className="text-center">{t("skins.cuerpo")}</TH>
                <TH>{t("skins.estado")}</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {(skins ?? []).map((x) => (
                <TR key={x.id}>
                  <TD>
                    <div className="font-gt-mono text-[12.5px] font-bold text-gt-ink-900">{x.skin}</div>
                    <div className="text-[11px] text-gt-ink-400">{(x.npcs ?? []).join(" · ") || "—"}</div>
                  </TD>
                  <TD>
                    <div className="grid place-items-center">
                      <RenderThumb skin={x.skin} kind="face" ok={!!x.face} size={28} />
                    </div>
                  </TD>
                  <TD>
                    <div className="grid place-items-center">
                      <RenderThumb skin={x.skin} kind="head" ok={!!x.head} size={36} />
                    </div>
                  </TD>
                  <TD>
                    <div className="grid place-items-center">
                      <RenderThumb skin={x.skin} kind="body" ok={!!x.body} size={44} />
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {(
                        [
                          ["skins.origen", x.src],
                          ["skins.tagFace", x.face],
                          ["skins.tagCabeza", x.head],
                          ["skins.tagCuerpo", x.body],
                        ] as const
                      ).map(([k, v]) => (
                        <span key={k} className="flex items-center gap-1">
                          <Icon name={v ? "check" : "x"} size={12} className={v ? "text-gt-ok" : "text-gt-danger"} />
                          <span className="font-gt-mono text-[10px] text-gt-ink-400">{t(k)}</span>
                        </span>
                      ))}
                    </div>
                  </TD>
                  <TD className="w-px whitespace-nowrap">
                    <Button size="sm" tone="ghost" icon="refresh" onClick={() => setEditing(x)}>
                      {t("common.edit")}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <NpcSkinModal open={creating} onClose={() => setCreating(false)} />
      <NpcSkinModal open={!!editing} onClose={() => setEditing(null)} skin={editing ?? undefined} />
    </>
  )
}
