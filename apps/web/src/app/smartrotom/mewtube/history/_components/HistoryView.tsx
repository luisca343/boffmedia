"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, SectionHeader, VideoCard } from "@/components/smartrotom/media/ui"
import { clearHistory, getHistory, type HistoryItem } from "../../_services/historyService"
import { toVideoCard } from "../../_utils/youtube"

export function HistoryView() {
  const t = useTranslations("mewtube")
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    setItems(getHistory())
  }, [])

  const videos = items.map((v) => toVideoCard(v))

  return (
    <div className="mx-auto max-w-[1640px] px-4 pb-20 pt-5 md:px-10">
      <SectionHeader
        eyebrow={t("history.yourActivity")}
        title={t("history.title")}
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
              {t("history.clearHistory")}
            </Button>
          )
        }
      />
      {videos.length === 0 ? (
        <p className="py-16 text-center text-sm text-mw-fg-faint">{t("history.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.href} v={v} />
          ))}
        </div>
      )}
    </div>
  )
}
