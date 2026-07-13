"use client"

import { useEffect, useState } from "react"
import { Button, SectionHeader } from "@/components/smartrotom/media/ui"
import { clearHistory, getHistory, type HistoryItem } from "../../_services/historyService"
import { MEWTWITCH_BASE, compactCount, twitchThumb } from "../../_utils/twitch"
import { getTimeSince } from "../../_utils/format"
import { VodCard, type VodCardData } from "../../_components/VodCard"

function hrefFor(item: HistoryItem): string {
  if (item.type === "video") return `${MEWTWITCH_BASE}/video/${item.id}`
  if (item.type === "clip") return `${MEWTWITCH_BASE}/clip/${item.id}`
  return `${MEWTWITCH_BASE}/stream/${item.streamer_name?.toLowerCase() ?? item.id}`
}

export function HistoryView() {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    setItems(getHistory())
  }, [])

  const cards: VodCardData[] = items.map((item) => ({
    href: hrefFor(item),
    thumb: twitchThumb(item.thumbnail_url, 640, 360),
    title: item.title,
    streamer: item.streamer_name,
    duration: item.duration,
    meta: [item.view_count != null && `${compactCount(item.view_count)} visitas`, item.created_at && getTimeSince(item.created_at)]
      .filter(Boolean)
      .join(" · "),
  }))

  return (
    <div className="mx-auto max-w-[1640px] px-4 pb-20 pt-5 md:px-10">
      <SectionHeader
        eyebrow="Tu actividad"
        title="Historial"
        action={
          items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearHistory()
                setItems([])
              }}
            >
              Borrar historial
            </Button>
          )
        }
      />
      {cards.length === 0 ? (
        <p className="py-16 text-center text-sm text-mw-fg-faint">Aún no has visto nada.</p>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((v) => (
            <VodCard key={v.href} v={v} />
          ))}
        </div>
      )}
    </div>
  )
}
