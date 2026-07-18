"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import {
  Avatar,
  Button,
  EmptyState,
  FeedSkeleton,
  Icon,
  SectionTitle,
  SegTabs,
  Skeleton,
  Sprite,
  StatPill,
  SubHeader,
  Verified,
} from "../_components/ui"
import { PostCard } from "../_components/PostCard"
import { DexTile } from "../_components/DexTile"
import { EditProfileModal } from "../_components/EditProfileModal"
import { useFollow, useMe, useProfile, useProfilePosts, useRookerUuid } from "../_hooks/queries"
import { useVitrina } from "../_hooks/useVitrina"
import { useFormat } from "../_hooks/useFormat"
import type { ProfileTab } from "../_types"

/**
 * A trainer's page.
 *
 * The banner is tinted by their **partner Pokémon** — the one thing on this page they
 * chose rather than earned. Everything else is derived and cannot be posed: the capture
 * count, the shiny count and the Pokédex percentage come from the registry, and the
 * battle count from the replay log. That is the trade the design makes — the decoration
 * is yours, the numbers are the server's.
 *
 * [deferred] The handoff also put a trainer LEVEL badge and a TEAM chip (Místico /
 * Valor / Sabio) up here. Neither exists: `rotom_users` has no level and the server has
 * no factions, so both are omitted rather than invented.
 */
export default function ProfilePage() {
  const t = useTranslations("rooker")
  const { exact, joinedAt } = useFormat()
  const params = useParams<{ handle: string }>()
  const handle = params.handle

  const uuid = useRookerUuid()
  const { data: me } = useMe()
  const { data: profile, isLoading, isError } = useProfile(handle)
  const [tab, setTab] = useState<ProfileTab>("trinos")
  const { data: posts, isLoading: postsLoading } = useProfilePosts(handle, tab)
  const { data: vitrina } = useVitrina(profile?.uuid)
  const allPokemon = usePokemonStore((s) => s.allPokemon)
  const follow = useFollow()
  const [editing, setEditing] = useState(false)

  const partnerName = useMemo(
    () => allPokemon.find((p) => p.dex === profile?.partnerPokemonId)?.name,
    [allPokemon, profile?.partnerPokemonId],
  )

  if (isLoading) {
    return (
      <div>
        <SubHeader title={t("profile.title")} back />
        <Skeleton className="h-[130px] rounded-none" />
        <div className="p-4">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
        <FeedSkeleton rows={3} />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div>
        <SubHeader title={t("profile.title")} back />
        <EmptyState
          icon="search"
          title={t("profile.notFound.title", { handle })}
          body={t("profile.notFound.body")}
        />
      </div>
    )
  }

  const isMe = uuid === profile.uuid
  const name = profile.displayName || profile.username
  const showcase = (vitrina ?? []).slice(0, 8)

  return (
    <div>
      <SubHeader
        title={name}
        subtitle={t("common.postsCount", { formatted: exact(profile.counts.posts), count: profile.counts.posts })}
        back
      />

      {/* The banner. Its tint is the partner's — a data-driven colour, so it is an
          inline gradient rather than a class (§4). */}
      <div className="relative h-[130px] overflow-hidden bg-gradient-to-br from-rk-accent/40 to-rk-card">
        {profile.partnerPokemonId && (
          <div className="absolute -bottom-2 right-3 opacity-90">
            <Sprite
              dex={profile.partnerPokemonId}
              size={120}
              pixelated={false}
              alt={partnerName ?? ""}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-rk-bg/50" />
      </div>

      <div className="px-4">
        <div className="-mt-9 flex items-end justify-between">
          <div className="rounded-full border-4 border-rk-bg">
            <Avatar user={profile} size={80} ring={false} />
          </div>

          {isMe ? (
            <Button intent="ghost" onClick={() => setEditing(true)} className="mb-1">
              {t("editProfile.title")}
            </Button>
          ) : uuid ? (
            <div className="mb-1 flex gap-2">
              <Link
                href="/smartrotom/chatapp"
                aria-label={t("profile.sendMessageAriaLabel")}
                className="grid h-[38px] w-[38px] place-items-center rounded-full border border-rk-line-strong text-rk-fg transition-colors hover:bg-rk-hover"
              >
                <Icon name="mail" size={17} />
              </Link>
              <Button
                intent={profile.isFollowedByMe ? "following" : "follow"}
                onClick={() => follow.mutate(profile.uuid)}
                disabled={follow.isPending}
                className="px-6"
              >
                {profile.isFollowedByMe ? t("common.follow.following") : t("common.follow.follow")}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[21px] font-extrabold text-rk-fg">{name}</span>
            {profile.isVerified && <Verified size={17} />}
          </div>
          <div className="text-[14.5px] text-rk-fg-subtle">@{profile.handle}</div>

          {profile.bio && (
            <p className="mt-2.5 whitespace-pre-wrap text-[14.5px] leading-relaxed text-rk-fg">
              {profile.bio}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-4 text-[13.5px] text-rk-fg-subtle">
            {profile.link && (
              <a
                href={profile.link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-rk-accent hover:underline"
              >
                <Icon name="link" size={14} />
                {profile.link.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={14} />
              {joinedAt(profile.createdAt)}
            </span>
          </div>

          <div className="mt-2.5 flex gap-4 text-[14px]">
            <span className="text-rk-fg-subtle">
              <b className="text-rk-fg">{exact(profile.counts.following)}</b> {t("profile.countsFollowing")}
            </span>
            <span className="text-rk-fg-subtle">
              <b className="text-rk-fg">{exact(profile.counts.followers)}</b> {t("profile.countsFollowers")}
            </span>
          </div>
        </div>

        {/* Derived from the registry and the replay log — never posed. */}
        <div className="mt-3.5 flex gap-2">
          <StatPill value={exact(profile.stats.captures)} label={t("profile.stats.captures")} icon="plus" tone="accent" />
          <StatPill value={exact(profile.stats.battles)} label={t("profile.stats.battles")} icon="sword" tone="fuego" />
          <StatPill value={exact(profile.stats.shinies)} label={t("profile.stats.shinies")} icon="sparkle" tone="shiny" filled />
          <StatPill value={`${Math.round(profile.stats.dexPct)}%`} label={t("profile.stats.dex")} icon="trophy" tone="choque" filled />
        </div>

        {showcase.length > 0 && (
          <div className="mt-4">
            <SectionTitle
              icon="grid"
              title={t("profile.vitrinaTitle")}
              action={
                isMe ? (
                  <Link
                    href="/smartrotom/rooker/vitrina"
                    className="text-[13px] font-bold text-rk-accent hover:underline"
                  >
                    {t("profile.viewCollection")}
                  </Link>
                ) : undefined
              }
            />
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {showcase.map((e, i) => (
                <DexTile
                  key={`${e.dex}-${i}`}
                  dex={e.dex}
                  form={e.form}
                  palette={e.palette}
                  shiny={e.shiny}
                  size={48}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <SegTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "trinos", label: t("profile.tabs.trinos") },
            { key: "capturas", label: t("profile.tabs.capturas") },
            { key: "combates", label: t("profile.tabs.combates") },
            { key: "media", label: t("profile.tabs.media") },
          ]}
        />
      </div>

      {postsLoading ? (
        <FeedSkeleton rows={3} />
      ) : posts?.length ? (
        posts.map((p, i) => <PostCard key={p.id} post={p} last={i === posts.length - 1} />)
      ) : (
        <EmptyState
          title={t("profile.noPosts.title")}
          body={isMe ? t("profile.noPosts.bodyMe") : t("profile.noPosts.bodyOther", { handle: profile.handle })}
        />
      )}

      {isMe && <EditProfileModal open={editing} onClose={() => setEditing(false)} profile={profile} />}
    </div>
  )
}
