"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Badge, Empty, Panel, Spinner, type IconName } from "@boffmedia/ui"
import {
  ActivityFeed,
  ProfileHero,
  ProfileNote,
  StatTile,
  TrophyCase,
  type ActivityData,
  type ProfileMetric,
  type StatTileData,
  type TrophyData,
} from "@/components/boffmedia/ui/profile"
import { ProfileService, type PublicProfile } from "@/services/api/boffmedia/profileService"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { useUserActivity, useUserTrophies } from "@/hooks/profile/useProfileStats"

// achievement category → a safe local IconName (mirrors ProfileView)
const CAT_ICON: Record<string, IconName> = {
  competition: "trophy",
  challenge: "target",
  participation: "users",
  achievement: "star",
}

export function PublicProfileView({ handle }: { handle: string }) {
  const t = useTranslations("profile")
  const locale = useLocale()

  const [profile, setProfile] = React.useState<PublicProfile | null>(null)
  const [state, setState] = React.useState<"loading" | "ok" | "notfound">("loading")

  React.useEffect(() => {
    let alive = true
    setState("loading")
    ProfileService.getByHandle(handle)
      .then((res) => {
        if (!alive) return
        if (res.data) {
          setProfile(res.data)
          setState("ok")
        } else {
          setState("notfound")
        }
      })
      .catch(() => alive && setState("notfound"))
    return () => {
      alive = false
    }
  }, [handle])

  const userId = profile?.id
  const { leaderboards } = useGetLeaderboards()
  const { trophies } = useUserTrophies(userId)
  const { activity } = useUserActivity(userId, 12)

  const relTime = React.useCallback(
    (iso: string) => {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
      const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
      const units: [number, Intl.RelativeTimeFormatUnit][] = [
        [60, "second"],
        [3600, "minute"],
        [86400, "hour"],
        [2592000, "day"],
        [31536000, "month"],
      ]
      if (sec < 60) return rtf.format(-sec, "second")
      for (let i = 1; i < units.length; i++) {
        const [limit, unit] = units[i]
        if (sec < limit) return rtf.format(-Math.round(sec / units[i - 1][0]), unit)
      }
      return rtf.format(-Math.round(sec / 31536000), "year")
    },
    [locale],
  )

  if (state === "loading") {
    return (
      <main className="wrap grid min-h-[60vh] place-items-center pb-[90px] pt-[34px]">
        <span className="inline-flex items-center gap-3 text-txt-muted">
          <Spinner /> {t("public.loading")}
        </span>
      </main>
    )
  }

  if (state === "notfound" || !profile) {
    return (
      <main className="wrap pb-[90px] pt-[64px]">
        <Empty icon="users" title={t("public.notFoundTitle")} lead={t("public.notFoundBody")} />
      </main>
    )
  }

  // Stats + hero metrics from the real global leaderboard (same source as /perfil).
  const me = (leaderboards ?? []).find((e) => Number(e.userId) === Number(profile.id))
  const stats: StatTileData[] = me
    ? [
        { icon: "trophy", value: `#${me.rank}`, label: t("stats.rank") },
        { icon: "bolt", value: me.totalPoints.toLocaleString(locale), label: t("stats.points") },
        {
          icon: "star",
          value: String(me.achievementCount),
          label: t("stats.achievements"),
          delta: trophies ? t("stats.ofTotal", { total: trophies.totalCount }) : undefined,
        },
        { icon: "shield", value: String(me.medalCount), label: t("stats.medals") },
      ]
    : []
  const metrics: ProfileMetric[] | undefined = me
    ? [
        { v: `#${me.rank}`, l: t("stats.rank") },
        { v: me.totalPoints.toLocaleString(locale), l: t("stats.points") },
      ]
    : undefined

  const trophyItems: TrophyData[] = (trophies?.trophies ?? []).slice(0, 12).map((tr) => ({
    icon: CAT_ICON[(tr.category || "").toLowerCase()] || (tr.itemType === "medal" ? "star" : "trophy"),
    name: tr.name,
    meta: tr.earned && tr.completedAt ? relTime(tr.completedAt) : tr.description ?? undefined,
    rare: tr.rarity ? t(`rarity.${tr.rarity}`) : undefined,
    done: tr.earned,
    locked: !tr.earned,
  }))

  const activityItems: ActivityData[] = activity.map((ac) => ({
    icon: ac.type === "achievement" ? "trophy" : "calendar",
    text: (
      <>
        {ac.type === "achievement" ? t("activity.unlocked") : t("activity.joined")} <b>{ac.name}</b>
      </>
    ),
    time: relTime(ac.at),
  }))

  const initial = (profile.name || "U").charAt(0).toUpperCase()
  const year = profile.memberSince ? new Date(profile.memberSince).getFullYear() : null
  const handleNode = (
    <>
      @<b>{profile.name}</b>
      {year != null && <> · {t("memberSince", { year })}</>}
    </>
  )
  const tags = (
    <>
      {profile.roles.map((r) => (
        <Badge key={r} tone="new">
          {r}
        </Badge>
      ))}
    </>
  )

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <div className="mb-[22px]">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(46px,5.4vw,64px)]">{t("public.title", { name: profile.name })}</h1>
      </div>

      <ProfileHero
        name={profile.name || "—"}
        handle={handleNode}
        initial={initial}
        avatarUrl={profile.avatarUrl}
        coverUrl={profile.coverUrl}
        bio={profile.bio || undefined}
        tags={tags}
        metrics={metrics}
      />

      <div className="mb-4">
        <ProfileNote>{t("public.note", { name: profile.name })}</ProfileNote>
      </div>

      {stats.length > 0 && (
        <div className="mb-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(148px,1fr))]">
          {stats.map((s) => (
            <StatTile key={s.label} {...s} />
          ))}
        </div>
      )}

      <div className="grid items-start gap-4 [grid-template-columns:1.05fr_0.95fr] max-[1080px]:grid-cols-1">
        <Panel title={t("section.trophies")}>
          {trophyItems.length > 0 ? (
            <TrophyCase trophies={trophyItems} />
          ) : (
            <Empty icon="trophy" title={t("trophies.emptyTitle")} lead={t("trophies.emptyBody")} />
          )}
        </Panel>

        <Panel title={t("section.activity")}>
          {activityItems.length > 0 ? (
            <ActivityFeed items={activityItems} />
          ) : (
            <Empty icon="clock" title={t("activity.emptyTitle")} lead={t("activity.emptyBody")} />
          )}
        </Panel>
      </div>
    </main>
  )
}
