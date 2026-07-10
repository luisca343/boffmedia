"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Empty,
  Panel,
  Spinner,
  toast,
  type IconName,
} from "@/components/boffmedia/primitives"
import {
  AccountForm,
  ActivityFeed,
  LinkedAccounts,
  LinkedAccountRow,
  ProfileHero,
  StatTile,
  TrophyCase,
  type AccountFormValues,
  type ActivityData,
  type ProfileMetric,
  type StatTileData,
  type TrophyData,
} from "@/components/boffmedia/ui/profile"
import { useBoffSession } from "@/services/useBoffSession"
import { UsersService } from "@/services/api/boffmedia/usersService"
import { UploadService } from "@/services/api/smartrotom/uploadService"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { useUserActivity, useUserTrophies } from "@/hooks/profile/useProfileStats"

type FullUser = NonNullable<Awaited<ReturnType<typeof UsersService.getUser>>["data"]>

// achievement category → a safe local IconName (mirrors ui/events/AchievementItem)
const CAT_ICON: Record<string, IconName> = {
  competition: "trophy",
  challenge: "target",
  participation: "users",
  achievement: "star",
}

const OK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_MB = 5

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

  const [full, setFull] = React.useState<FullUser | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [coverUploading, setCoverUploading] = React.useState(false)
  const [avatarOverride, setAvatarOverride] = React.useState<string | null>(null)
  const [coverOverride, setCoverOverride] = React.useState<string | null>(null)
  const [values, setValues] = React.useState<AccountFormValues>({ name: "", email: "", bio: "" })
  const fileRef = React.useRef<HTMLInputElement>(null)
  const coverRef = React.useRef<HTMLInputElement>(null)

  const userId = user?.id ? Number(user.id) : null
  const { leaderboards } = useGetLeaderboards()
  const { trophies } = useUserTrophies(userId)
  const { activity } = useUserActivity(userId, 12)

  const loadFull = React.useCallback(() => {
    if (!userId) return
    UsersService.getUser(userId)
      .then((res) => {
        if (res.data) setFull(res.data)
      })
      .catch(() => {})
  }, [userId])

  React.useEffect(() => {
    loadFull()
  }, [loadFull])

  // Toast the result of a provider link round-trip. The Steam/Discord callbacks
  // redirect back to /perfil?linked=<p> or ?linked_error=<p>[_taken]; strip the
  // query afterwards so a refresh doesn't re-fire it.
  const linkQueryHandled = React.useRef(false)
  React.useEffect(() => {
    if (linkQueryHandled.current) return
    const sp = new URLSearchParams(window.location.search)
    const linked = sp.get("linked")
    const err = sp.get("linked_error")
    if (!linked && !err) return
    linkQueryHandled.current = true
    if (linked === "steam") {
      toast.success(t("linked.steamLinked"))
      loadFull()
    } else if (linked === "discord") {
      toast.success(t("linked.discordLinked"))
      loadFull()
    } else if (linked === "google") {
      toast.success(t("linked.googleLinked"))
      loadFull()
    } else if (linked === "twitch") {
      toast.success(t("linked.twitchLinked"))
      loadFull()
    } else if (err === "steam_taken") {
      toast.error(t("linked.steamTaken"))
    } else if (err === "discord_taken") {
      toast.error(t("linked.discordTaken"))
    } else if (err === "google_taken") {
      toast.error(t("linked.googleTaken"))
    } else if (err === "twitch_taken") {
      toast.error(t("linked.twitchTaken"))
    } else if (err === "discord") {
      toast.error(t("linked.discordError"))
    } else if (err === "google") {
      toast.error(t("linked.googleError"))
    } else if (err === "twitch") {
      toast.error(t("linked.twitchError"))
    } else if (err) {
      toast.error(t("linked.steamError"))
    }
    window.history.replaceState(null, "", window.location.pathname)
  }, [t, loadFull])

  React.useEffect(() => {
    if (user) {
      setValues({ name: user.name ?? "", email: user.email ?? "", bio: full?.bio ?? "" })
    }
  }, [user?.name, user?.email, full?.bio])

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

  function validateImage(file: File): string | null {
    if (!OK_IMAGE_TYPES.includes(file.type)) return t("avatar.badType")
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return t("avatar.tooBig", { mb: MAX_IMAGE_MB })
    return null
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    try {
      const res = await UsersService.updateUser(userId, {
        username: values.name,
        email: values.email,
        bio: values.bio ?? "",
      } as never)
      if (res.success) {
        setFull((prev) => (prev ? { ...prev, bio: values.bio ?? prev.bio } : prev))
        try {
          await update()
        } catch {}
        toast.success(t("saved"))
        setEditing(false)
      } else {
        toast.error(res.error || t("saveError"))
      }
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const invalid = validateImage(file)
    if (invalid) {
      toast.error(invalid)
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    setUploading(true)
    try {
      const up = await UploadService.uploadProfileImage(file, String(userId))
      if (!up.data?.url) {
        toast.error(t("avatar.error"))
        return
      }
      const url = up.data.url
      setAvatarOverride(url) // optimistic — no page reload
      const res = await UsersService.updateUser(userId, { profilePicture: url } as never)
      if (!res.success) {
        setAvatarOverride(null)
        toast.error(res.error || t("avatar.error"))
        return
      }
      setFull((prev) => (prev ? { ...prev, profilePicture: url } : prev))
      try {
        await update() // refresh session (navbar avatar) in place, no reload
      } catch {}
      toast.success(t("avatar.updated"))
    } catch {
      toast.error(t("avatar.error"))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const invalid = validateImage(file)
    if (invalid) {
      toast.error(invalid)
      if (coverRef.current) coverRef.current.value = ""
      return
    }
    setCoverUploading(true)
    try {
      const up = await UploadService.uploadCoverImage(file, String(userId))
      if (!up.data?.url) {
        toast.error(t("cover.error"))
        return
      }
      const url = up.data.url
      setCoverOverride(url) // optimistic — no page reload
      const res = await UsersService.updateUser(userId, { coverImage: url } as never)
      if (!res.success) {
        setCoverOverride(null)
        toast.error(res.error || t("cover.error"))
        return
      }
      setFull((prev) => (prev ? { ...prev, coverImage: url } : prev))
      toast.success(t("cover.updated"))
    } catch {
      toast.error(t("cover.error"))
    } finally {
      setCoverUploading(false)
      if (coverRef.current) coverRef.current.value = ""
    }
  }

  async function handleUnlink(provider: "google" | "discord" | "steam" | "twitch") {
    if (!userId) return
    try {
      const res = await UsersService.unlinkProvider(userId, provider)
      if (res.success) {
        loadFull()
        try {
          await update()
        } catch {}
        toast.success(t("linked.unlinkedDone"))
      } else {
        toast.error(res.error || t("saveError"))
      }
    } catch {
      toast.error(t("saveError"))
    }
  }

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
  const mcLinked = !!user.smartRotomUser?.uuid
  // steamId/twitchId are on the API response at runtime (repo selects them); the
  // `as` keeps type-check green until `pnpm generate:shared` adds them to the model.
  const providerIds = full as (FullUser & { steamId?: string | null; twitchId?: string | null }) | null
  const steamLinked = Boolean(providerIds?.steamId)
  const twitchLinked = Boolean(providerIds?.twitchId)

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

  const linkEnd = (linked: boolean, provider?: "google" | "discord" | "steam" | "twitch") => {
    if (linked) {
      if (editing && provider) {
        return (
          <Button size="sm" variant="ghost" icon="x" onClick={() => handleUnlink(provider)}>
            {t("linked.unlink")}
          </Button>
        )
      }
      return <Badge tone="ok">{t("linked.linked")}</Badge>
    }
    // Steam/Google always link via their flow; Discord only when the app is
    // configured. A full navigation (not client-nav) is required so the route's
    // redirect to the provider is followed by the browser.
    const linkHref =
      provider === "steam"
        ? "/api/steam/link"
        : provider === "google"
          ? "/api/google/link"
          : provider === "discord" && discordEnabled
            ? "/api/discord/link"
            : provider === "twitch" && twitchEnabled
              ? "/api/twitch/link"
              : null
    if (linkHref) {
      return (
        <Button
          size="sm"
          icon="link"
          onClick={() => {
            window.location.href = linkHref
          }}
        >
          {t("linked.link")}
        </Button>
      )
    }
    return (
      <Button size="sm" disabled title={t("linked.soon")} icon="link">
        {t("linked.link")}
      </Button>
    )
  }

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-[22px]">
        <div>
          <span className="mono-label">{t("kicker")}</span>
          <h1 className="mt-2 text-[clamp(46px,5.4vw,64px)]">{t("title")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {user.name && !editing && (
            <Button variant="ghost" icon="eye" href={`/u/${encodeURIComponent(user.name)}`}>
              {t("public.viewMine")}
            </Button>
          )}
          <Button
            variant={editing ? "pri" : "default"}
            icon={editing ? "check" : "cog"}
            loading={saving}
            onClick={editing ? handleSave : () => setEditing(true)}
          >
            {editing ? t("save") : t("edit")}
          </Button>
        </div>
      </div>

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

      <div className="grid items-start gap-4 [grid-template-columns:1.05fr_0.95fr] max-[1080px]:grid-cols-1">
        <Panel title={t("section.account")}>
          <AccountForm
            values={values}
            editing={editing}
            showBio
            onChange={(f, v) => setValues((prev) => ({ ...prev, [f]: v }))}
          />
        </Panel>

        <Panel title={t("section.linked")}>
          <LinkedAccounts>
            <LinkedAccountRow
              icon="google"
              name="Google"
              hue="#ea4335"
              linked={!!full?.googleId}
              sub={full?.googleId ? t("linked.linked") : t("linked.unlinked")}
              end={linkEnd(!!full?.googleId, "google")}
            />
            <LinkedAccountRow
              icon="discord"
              name="Discord"
              hue="#5865F2"
              linked={!!full?.discordId}
              sub={full?.discordId ? t("linked.linked") : t("linked.unlinked")}
              end={linkEnd(!!full?.discordId, "discord")}
            />
            <LinkedAccountRow
              icon="steam"
              name="Steam"
              hue="#66c0f4"
              linked={steamLinked}
              sub={steamLinked ? t("linked.linked") : t("linked.unlinked")}
              end={linkEnd(steamLinked, "steam")}
            />
            <LinkedAccountRow
              icon="twitch"
              name="Twitch"
              hue="#9146FF"
              linked={twitchLinked}
              sub={twitchLinked ? t("linked.linked") : t("linked.unlinked")}
              end={linkEnd(twitchLinked, "twitch")}
            />
            <LinkedAccountRow
              icon="gamepad"
              name="Minecraft"
              hue="#3fbf5f"
              linked={mcLinked}
              sub={mcLinked ? (user.smartRotomUser?.username ?? t("linked.linked")) : t("linked.unlinked")}
              end={mcLinked ? <Badge tone="ok">{t("linked.linked")}</Badge> : linkEnd(false)}
            />
          </LinkedAccounts>
        </Panel>
      </div>

      <div className="mt-4 grid items-start gap-4 [grid-template-columns:1.05fr_0.95fr] max-[1080px]:grid-cols-1">
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
