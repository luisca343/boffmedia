"use client"

import { Avatar, Button, Check, I, PillBtn } from "@/components/smartrotom/media/ui"
import { useChannel, useChannelUploads } from "../../_hooks/useYoutube"
import { formatCount, toVideoCard } from "../../_utils/youtube"
import { VideoSection } from "../../_components/VideoSection"

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-mw-fg-faint">{label}</span>
      <strong className="font-mw-display text-lg font-bold">{value}</strong>
    </div>
  )
}

export function ChannelView({ id }: { id: string }) {
  const channel = useChannel(id)
  const uploads = useChannelUploads(id)
  const c = channel.data

  if (channel.isLoading) return <div className="p-6 text-sm text-mw-fg-faint">Cargando canal…</div>
  if (!c) return <div className="p-6 text-sm text-mw-fg-faint">No se encontró el canal.</div>

  const banner = c.brandingSettings?.image?.bannerExternalUrl
  const avatar = c.snippet.thumbnails.high?.url ?? c.snippet.thumbnails.medium?.url
  const subs = Number(c.statistics.subscriberCount)
  const views = Number(c.statistics.viewCount)
  const vids = Number(c.statistics.videoCount)
  const avg = vids > 0 ? Math.round(views / vids) : 0
  const since = c.snippet.publishedAt ? new Date(c.snippet.publishedAt).getFullYear() : undefined
  const videos = (uploads.data ?? []).map((v) => toVideoCard(v))

  return (
    <div>
      {banner && (
        <div className="relative h-[200px]">
          <img src={banner} alt="" className="h-full w-full object-cover brightness-[0.7]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top,rgb(var(--mw-bg)),color-mix(in srgb,rgb(var(--mw-accent)) 25%,rgb(var(--mw-bg))) 50%,transparent 80%)",
            }}
          />
        </div>
      )}
      <div className="mx-auto max-w-[1640px] px-4 pb-20 md:px-10">
        <div className="grid grid-cols-1 items-start gap-8 pb-6 md:grid-cols-[140px_1fr_auto]" style={banner ? { marginTop: -60 } : { marginTop: 24 }}>
          <Avatar
            src={avatar}
            name={c.snippet.title}
            size={140}
            className="border-4 border-mw-bg shadow-[0_24px_50px_-20px_rgb(var(--mw-accent)/.35)]"
          />
          <div className="min-w-0">
            <h1 className="mb-1.5 mt-3 inline-flex items-center gap-2.5 font-mw-display text-[36px] font-extrabold tracking-[-0.01em]">
              {c.snippet.title}
              <Check size="lg" />
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-mw-fg-mute">
              {c.snippet.customUrl && <span>{c.snippet.customUrl}</span>}
              <span className="h-1 w-1 rounded-full bg-mw-fg-faint" />
              <span>
                <strong className="text-mw-fg">{formatCount(subs)}</strong> suscriptores
              </span>
              <span className="h-1 w-1 rounded-full bg-mw-fg-faint" />
              <span>{formatCount(vids)} vídeos</span>
            </div>
            {c.snippet.description && (
              <p className="my-3 max-w-[720px] whitespace-pre-line text-[13px] text-mw-fg-mute line-clamp-3">
                {c.snippet.description}
              </p>
            )}
            <div className="mt-1.5 inline-flex items-center gap-2">
              {/* [deferred] real subscribe needs Google OAuth (§13) */}
              <Button variant="solid" aria-disabled title="Próximamente">
                Suscribirse
              </Button>
              <PillBtn iconOnly aria-label="Notificaciones">
                <I.bell size={14} />
              </PillBtn>
            </div>
          </div>
          <div className="grid grid-flow-col gap-6 rounded-mw-xl border border-[color-mix(in_srgb,rgb(var(--mw-accent))_30%,var(--mw-hairline))] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_8%,rgb(var(--mw-800)))] px-[22px] py-3.5 max-md:justify-start">
            <Kpi label="Visualizaciones" value={formatCount(views)} />
            <Kpi label="Promedio" value={formatCount(avg)} />
            {since && <Kpi label="Activo desde" value={String(since)} />}
          </div>
        </div>

        <VideoSection title="Últimas subidas" videos={videos} loading={uploads.isLoading} />
      </div>
    </div>
  )
}
