"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Badge,
  Button,
  Empty,
  Panel,
  Seg,
  Spinner,
  type IconName,
} from "@boffmedia/ui"
import {
  AccountForm,
  ActivityFeed,
  ProfileHero,
  StatTile,
  TrophyCase,
  type ActivityData,
  type ProfileMetric,
  type StatTileData,
  type TrophyData,
} from "@/components/boffmedia/ui/profile"
import { useBoffSession } from "@/services/useBoffSession"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { useUserActivity, useUserTrophies } from "@/hooks/profile/useProfileStats"
import { useProfileEditor } from "./useProfileEditor"
import { LinkedAccountsPanel } from "./LinkedAccountsPanel"
import { ProfileTournamentsTab } from "./ProfileTournamentsTab"

// achievement category → a safe local IconName (mirrors ui/events/AchievementItem)
const CAT_ICON: Record<string, IconName> = {
  competition: "trophy",
  challenge: "target",
  participation: "users",
  achievement: "star",
}

export function ProfileView({
  discordEnabled = false,
  twitchEnabled = false,
}: {
  discordEnabled?: boolean
  twitchEnabled?: boolean
}) {
  const t = useTranslations("profile")
  const locale = useLocale()
  const { session, status, update } = useBoffSession()
  const user = session?.user
  const rotomUuid = useRotomUuid()

  const userId = user?.id ? Number(user.id) : null
  const { leaderboards } = useGetLeaderboards()
  const { trophies } = useUserTrophies(userId)
  const { activity } = useUserActivity(userId, 12)

  const router = useRouter()
  const [view, setView] = React.useState<"privada" | "torneos">("privada")
  // Deep-link `/perfil?tab=torneos` → open the tab on mount (client-only, no Suspense caveat).
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "torneos") setView("torneos")
  }, [])
  const isTours = view === "torneos"
  // «Pública» is a dedicated route (`/u/[handle]`), so that segment navigates there.
  const onTab = (v: string) => {
    if (v === "publica") {
      if (user?.name) router.push(`/u/${encodeURIComponent(user.name)}`)
      return
    }
    setView(v === "torneos" ? "torneos" : "privada")
  }

  const {
    full,
    editing,
    setEditing,
    saving,
    uploading,
    coverUploading,
    avatarOverride,
    coverOverride,
    values,
    setValues,
    fileRef,
    coverRef,
    handleSave,
    handleFile,
    handleCoverFile,
    handleUnlink,
  } = useProfileEditor({ userId, user, update })

  // ── Relative-time formatter (localized) ──────────────────────────────────
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

  if (status === "loading") {
    return (
      <main className="wrap grid min-h-[60vh] place-items-center">
        <Spinner />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="wrap">
        <Empty icon="user" title={t("loggedOut.title")} lead={t("loggedOut.body")}>
          <Button variant="pri" icon="user" href="/entrar">
            {t("loggedOut.cta")}
          </Button>
        </Empty>
      </main>
    )
  }

  const initial = (user.name || "U").charAt(0).toUpperCase()
  const year = full?.createdAt ? new Date(full.createdAt).getFullYear() : null
  const mcLinked = !!rotomUuid
  const steamLinked = Boolean(full?.steamId)
  const twitchLinked = Boolean(full?.twitchId)

  // ── B — career stats + hero metrics from the real global leaderboard ─────
  const me = (leaderboards ?? []).find((e) => Number(e.userId) === Number(user.id))
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

  // ── D — trophies + activity from real per-user data ──────────────────────
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

  const handle = (
    <>
      @<b>{user.name}</b>
      {year != null && <> · {t("memberSince", { year })}</>}
    </>
  )

  const tags = (
    <>
      {(user.roles ?? []).map((r) => (
        <Badge key={r} tone="new">
          {r}
        </Badge>
      ))}
      {mcLinked && <Badge tone="live">Minecraft</Badge>}
    </>
  )

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-[22px]">
        <div>
          <span className="mono-label">{isTours ? t("tours.kicker") : t("kicker")}</span>
          <h1 className="mt-2 text-[clamp(46px,5.4vw,64px)]">{isTours ? t("tours.title") : t("title")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Seg
            value={view}
            onChange={onTab}
            options={[
              { value: "privada", label: t("tabs.private") },
              { value: "publica", label: t("tabs.public") },
              { value: "torneos", label: t("tabs.tournaments") },
            ]}
          />
          {!isTours && (
            <Button
              variant={editing ? "pri" : "default"}
              icon={editing ? "check" : "cog"}
              loading={saving}
              onClick={editing ? handleSave : () => setEditing(true)}
            >
              {editing ? t("save") : t("edit")}
            </Button>
          )}
        </div>
      </div>

      {isTours ? (
        <ProfileTournamentsTab />
      ) : (
        <>
          <ProfileHero
            name={user.name || "—"}
            handle={handle}
            initial={initial}
            avatarUrl={avatarOverride ?? user.image ?? full?.profilePicture}
            coverUrl={coverOverride ?? full?.coverImage}
            bio={full?.bio || undefined}
            tags={tags}
            metrics={metrics}
            editable
            uploading={uploading}
            coverUploading={coverUploading}
            avatarLabel={t("avatar.change")}
            coverLabel={t("cover.change")}
            onAvatarClick={() => !uploading && fileRef.current?.click()}
            onCoverClick={() => !coverUploading && coverRef.current?.click()}
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />

          {stats.length > 0 && (
            <div className="mb-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(148px,1fr))]">
              {stats.map((s) => (
                <StatTile key={s.label} {...s} />
              ))}
            </div>
          )}

          {/* Two independent column stacks (handoff pf-grid → pf-col) so a tall
              panel never opens a gap under a shorter one in the same row. */}
          <div className="grid items-start gap-4 [grid-template-columns:1.05fr_0.95fr] max-[1080px]:grid-cols-1">
            <div className="grid min-w-0 gap-4">
              <Panel title={t("section.account")}>
                <AccountForm
                  values={values}
                  editing={editing}
                  showBio
                  onChange={(f, v) => setValues((prev) => ({ ...prev, [f]: v }))}
                />
              </Panel>

              <Panel title={t("section.trophies")}>
                {trophyItems.length > 0 ? (
                  <TrophyCase trophies={trophyItems} />
                ) : (
                  <Empty icon="trophy" title={t("trophies.emptyTitle")} lead={t("trophies.emptyBody")} />
                )}
              </Panel>
            </div>

            <div className="grid min-w-0 gap-4">
              <LinkedAccountsPanel
                googleId={full?.googleId}
                discordId={full?.discordId}
                steamLinked={steamLinked}
                twitchLinked={twitchLinked}
                mcLinked={mcLinked}
                mcUsername={user.smartRotomUser?.username}
                editing={editing}
                discordEnabled={discordEnabled}
                twitchEnabled={twitchEnabled}
                onUnlink={handleUnlink}
                // A fresh link changes mcLinked and the SmartRotom half of the
                // session, neither of which the page can know about otherwise.
                //
                // `update()` FIRST, and awaited: a bare reload re-runs the jwt
                // callback with `trigger === undefined`, which deliberately does
                // NOT refetch (see authOptions — refetching on every page load
                // caused a refresh storm). The cookie would keep its pre-link
                // claims, `smartRotomUser` would stay undefined for up to 55
                // minutes, and the account would read as unlinked however many
                // times the player reloaded. Only `trigger === 'update'` pulls
                // the new SmartRotom identity down.
                onMinecraftLinked={async () => {
                  await update()
                  window.location.reload()
                }}
              />

              <Panel title={t("section.activity")}>
                {activityItems.length > 0 ? (
                  <ActivityFeed items={activityItems} />
                ) : (
                  <Empty icon="clock" title={t("activity.emptyTitle")} lead={t("activity.emptyBody")} />
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
