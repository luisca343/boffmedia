"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Badge, Icon, Panel } from "@boffmedia/ui"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { Byline, CmAvatar } from "./CmAvatar"
import { fmtNum, timeAgo, type ForumCategoryLike, type ForumMember, type ForumStatsData, type ForumThreadLike } from "./community-util"

// The forum pieces: thread row, category tile, member row and the two sidebar
// widgets (online list + stats). Prefix fo- in comunidad.css.

export function ThreadRow({
  thread,
  onOpen,
  compact,
  showCat,
  now,
}: {
  thread: ForumThreadLike
  onOpen?: (href: string) => void
  compact?: boolean
  showCat?: boolean
  // Reference «now» for relative timestamps. Undefined keeps the frozen
  // showcase CM_NOW default; real pages pass a live Date.
  now?: Date
}) {
  const t = useTranslations("common.forum")
  const open = () => onOpen && onOpen("/foro/" + thread.catSlug + "/" + thread.id)
  const hot = thread.replies >= 3 || (thread.votes || 0) >= 40
  return (
    <div
      style={{ "--chue": thread.catHue ?? 28 } as React.CSSProperties}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open()
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group grid cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-solid border-line px-5 py-[15px] transition-[background] duration-[140ms] last:border-b-0 hover:bg-panel-2",
        compact && "px-[18px] py-3",
      )}
    >
      <span
        className={cn(
          "relative grid h-11 w-11 flex-none place-items-center border border-solid border-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_40%,var(--line-2))] bg-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_14%,var(--panel-2))] font-display text-[18px]/none font-extrabold italic text-[hsl(var(--chue)_78%_64%)] cut-seal cut-seal-edge [--cut-line:color-mix(in_srgb,hsl(var(--chue)_70%_50%)_40%,var(--line-2))] [--cut:8px]",
          compact && "h-[38px] w-[38px] text-[15px]",
        )}
      >
        {thread.author?.avatarUrl ? (
          <ArtImage
            src={thread.author.avatarUrl}
            alt={thread.author.name ?? ""}
            width={compact ? 38 : 44}
            height={compact ? 38 : 44}
            className="h-full w-full"
            fallback={<span>{thread.author.avatar}</span>}
          />
        ) : thread.author ? (
          thread.author.avatar
        ) : (
          "?"
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-[9px]">
          {thread.pinned && <Icon name="bookmark" size={13} className="text-accent" />}
          {thread.locked && <Icon name="lock" size={13} className="text-txt-dim" />}
          <h3 className="font-display text-[17px]/[1.2] font-bold uppercase not-italic tracking-[0.01em] group-hover:text-accent-bright">{thread.title}</h3>
          {thread.solved && <Badge tone="ok">{t("solved")}</Badge>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[10px]/none font-medium uppercase tracking-[0.06em] text-txt-muted">
          <span>{thread.author ? thread.author.name : t("anonymous")}</span>
          {showCat && thread.catName && (
            <>
              <span className="text-line-2">·</span>
              <span>{thread.catName}</span>
            </>
          )}
          <span className="text-line-2">·</span>
          <span>{timeAgo(thread.createdAt, now)}</span>
          {thread.replies > 0 && thread.lastAuthor && (
            <>
              <span className="text-line-2">·</span>
              <span>
                {t("lastBy", { name: thread.lastAuthor.name })}
                {thread.lastAt && <> · {timeAgo(thread.lastAt, now)}</>}
              </span>
            </>
          )}
        </div>
      </div>
      <div className={cn("flex flex-none items-center gap-[18px]", compact && "gap-3")}>
        <span className="text-center">
          <b className={cn("block font-mono text-[16px]/none font-bold", hot ? "text-accent" : "text-txt")}>{thread.replies}</b>
          <span className="mt-1 block font-mono text-[9px]/none font-medium uppercase tracking-[0.08em] text-txt-dim">{t("replies")}</span>
        </span>
        <span className="text-center">
          <b className="block font-mono text-[16px]/none font-bold text-txt">{fmtNum(thread.views)}</b>
          <span className="mt-1 block font-mono text-[9px]/none font-medium uppercase tracking-[0.08em] text-txt-dim">{t("views")}</span>
        </span>
      </div>
    </div>
  )
}

export function CategoryTile({ cat, onOpen, now }: { cat: ForumCategoryLike; onOpen?: (href: string) => void; now?: Date }) {
  const t = useTranslations("common.forum")
  const open = () => onOpen && onOpen("/foro/" + cat.slug)
  return (
    <div
      style={{ "--chue": cat.hue } as React.CSSProperties}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open()
      }}
      role="button"
      tabIndex={0}
      className="grid cursor-pointer grid-cols-[56px_1fr_auto] items-center gap-[18px] border border-solid border-line border-l-4 border-l-[hsl(var(--chue)_72%_55%)] bg-panel px-[22px] py-[18px] text-left transition-[border-color,background] duration-[140ms] cut-corner cut-corner-edge hover:[--cut-line:var(--accent-line)] hover:border-accent-line hover:border-l-accent hover:bg-panel-2"
    >
      <span className="grid h-14 w-14 flex-none place-items-center border border-solid border-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_42%,var(--line-2))] bg-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_14%,var(--panel-2))] text-[hsl(var(--chue)_78%_64%)] cut-seal cut-seal-edge [--cut-line:color-mix(in_srgb,hsl(var(--chue)_70%_50%)_42%,var(--line-2))] [--cut:10px]">
        <Icon name={cat.icon} size={24} />
      </span>
      <div>
        <h3 className="flex items-center gap-2.5 font-display text-[20px]/none font-bold uppercase not-italic">
          {cat.name}
          {cat.locked && <Icon name="lock" size={14} className="text-txt-dim" />}
        </h3>
        <p className="mt-[7px] text-[14px]/[1.5] text-txt-muted">{cat.description}</p>
      </div>
      <div className="flex flex-none items-center gap-[22px]">
        <span className="text-center">
          <b className="block font-display text-[24px]/none font-extrabold italic text-txt">{cat.threads}</b>
          <span className="mt-[5px] block font-mono text-[9px]/none font-medium uppercase tracking-[0.1em] text-txt-muted">{t("threads")}</span>
        </span>
        <span className="text-center">
          <b className="block font-display text-[24px]/none font-extrabold italic text-txt">{fmtNum(cat.posts)}</b>
          <span className="mt-[5px] block font-mono text-[9px]/none font-medium uppercase tracking-[0.1em] text-txt-muted">{t("posts")}</span>
        </span>
        {cat.lastAuthor && cat.lastAt && (
          <div className="min-w-[150px] border-l border-solid border-line pl-[22px]">
            <span className="mb-2 block font-mono text-[9px]/none font-medium uppercase tracking-[0.1em] text-txt-dim">{t("lastActivity")}</span>
            <Byline author={cat.lastAuthor} when={cat.lastAt} size={24} link={false} now={now} />
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_DOT: Record<string, string> = { online: "bg-ok", idle: "bg-warn", offline: "bg-txt-dim" }

export function CmMemberRow({
  member,
  rank,
  count,
  onOpen,
}: {
  member: ForumMember
  rank?: number
  count?: number
  onOpen?: (href: string) => void
  // Accepted for API parity with the other forum rows (OnlineList forwards it);
  // this row renders no relative timestamp so it is currently unused.
  now?: Date
}) {
  const open = () => onOpen && onOpen("/blog/autor/" + member.handle)
  return (
    <div
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open()
      }}
      role="button"
      tabIndex={0}
      className="group flex cursor-pointer items-center gap-3 border-b border-solid border-line px-1 py-[9px] last:border-b-0"
    >
      {rank != null && <span className="w-[22px] flex-none font-display text-[16px]/none font-extrabold italic text-accent">{rank}</span>}
      <span className="relative flex-none">
        <CmAvatar author={member} size={34} />
        {member.status && (
          <span className={cn("absolute -bottom-[2px] -right-[2px] h-2.5 w-2.5 rounded-full border-2 border-panel", STATUS_DOT[member.status] || "bg-txt-dim")} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[13px]/[1.1] font-bold uppercase not-italic tracking-[0.02em] group-hover:text-accent-bright">{member.name}</span>
        <span className="mt-[3px] block font-mono text-[9px]/none font-medium uppercase tracking-[0.06em] text-txt-muted">{member.role}</span>
      </span>
      {count != null && <span className="flex-none font-mono text-[13px]/none font-semibold text-accent">{count}</span>}
    </div>
  )
}

function WidgetHead({ icon, title, right }: { icon: "users" | "chart"; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2.5">
      <h4 className="flex items-center gap-[9px] font-display text-[14px]/none font-bold uppercase not-italic tracking-[0.03em]">
        <Icon name={icon} size={16} className="text-accent" />
        {title}
      </h4>
      {right}
    </div>
  )
}

export function OnlineList({ members, onOpen, now }: { members: ForumMember[]; onOpen?: (href: string) => void; now?: Date }) {
  const t = useTranslations("common.forum")
  return (
    <Panel>
      <WidgetHead icon="users" title={t("onlineNow")} right={<span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ok">{members.length}</span>} />
      <div className="grid">
        {members.map((m) => (
          <CmMemberRow key={m.handle} member={m} onOpen={onOpen} now={now} />
        ))}
      </div>
    </Panel>
  )
}

export function ForumStats({ stats }: { stats: ForumStatsData }) {
  const t = useTranslations("common.forum")
  const cells: [string, string][] = [
    [fmtNum(stats.posts), t("posts")],
    [String(stats.threads), t("threads")],
    [fmtNum(stats.members), t("members")],
    [String(stats.online), t("online")],
  ]
  return (
    <Panel>
      <WidgetHead icon="chart" title={t("stats")} />
      <div className="grid grid-cols-2 gap-px border border-solid border-line bg-line">
        {cells.map(([val, label]) => (
          <div key={label} className="bg-panel p-[14px] text-center">
            <b className="block font-display text-[26px]/none font-extrabold italic text-accent">{val}</b>
            <span className="mt-1.5 block font-mono text-[9px]/none font-medium uppercase tracking-[0.1em] text-txt-muted">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-[14px] text-center font-mono text-[11px]/[1.4] font-medium uppercase tracking-[0.04em] text-txt-muted">
        {t("newMember")} <b className="text-accent">{stats.newest}</b>
      </p>
    </Panel>
  )
}
