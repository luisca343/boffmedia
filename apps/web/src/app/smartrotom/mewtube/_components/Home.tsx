"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChipRail } from "@/components/smartrotom/media"
import { Button, I } from "@/components/smartrotom/media/ui"
import { useSearchVideos, useTrending } from "../_hooks/useYoutube"
import { toVideoCard } from "../_utils/youtube"
import { FeaturedHero } from "./FeaturedHero"
import { VideoSection } from "./VideoSection"

export function Home() {
  const t = useTranslations("mewtube")
  const params = useSearchParams()
  const q = params.get("q") ?? ""
  const searching = q.trim().length > 0

  const trending = useTrending()
  const search = useSearchVideos(q)

  if (searching) {
    const results = (search.data ?? []).map((v) => toVideoCard(v))
    return (
      <>
        <ChipRail />
        <div className="mx-auto max-w-[102.5rem] px-4 pb-20 pt-5 md:px-10">
          <VideoSection title={t("home.searchResults", { query: q })} videos={results} loading={search.isLoading} />
          {search.isError && (
            <p className="py-12 text-center text-sm text-mw-fg-faint">{t("home.noResults")}</p>
          )}
        </div>
      </>
    )
  }

  const videos = (trending.data ?? []).map((v) => toVideoCard(v))
  const [featured, ...rest] = videos
  const seeAll = (
    <Button variant="ghost" size="sm" aria-disabled title={t("home.comingSoon")}>
      {t("common.viewAll")} <I.chevron size={14} />
    </Button>
  )

  return (
    <>
      <ChipRail />
      {featured && <FeaturedHero data={featured} />}
      <div className="mx-auto max-w-[102.5rem] px-4 pb-20 pt-5 md:px-10">
        <VideoSection
          eyebrow={t("home.trending")}
          title={t("home.trendingNow")}
          videos={rest}
          loading={trending.isLoading}
          action={seeAll}
        />
        {trending.isError && (
          <p className="py-12 text-center text-sm text-mw-fg-faint">{t("home.errorLoading")}</p>
        )}
      </div>
    </>
  )
}
