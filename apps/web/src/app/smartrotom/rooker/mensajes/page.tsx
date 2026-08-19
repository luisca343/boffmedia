"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import type { Chat } from "@boffmedia/shared"
import { ChatAppService } from "@/services/api/smartrotom/chatAppService"
import { cn } from "@/lib/utils"
import { Avatar, Button, EmptyState, FeedSkeleton, Icon, SubHeader } from "../_components/ui"
import { useRookerUuid } from "../_hooks/queries"
import { useFormat } from "../_hooks/useFormat"

/**
 * Mensajes.
 *
 * Rooker does NOT own messaging. ChatApp is already the server's messenger — real
 * conversations, real sockets, real history — and APPS.md says as much: "mutual follow
 * unlocks DM (or routes to ChatApp conversation)". Building a second inbox here would
 * have split every player's history across two apps that could never see each other's
 * messages.
 *
 * So this screen reads ChatApp's real direct conversations (`chat.type === 2`), paints
 * them in `rk-*`, and hands off to ChatApp to actually talk. One messaging backend, two
 * front doors.
 */
const DIRECT = 2

export default function MensajesPage() {
  const t = useTranslations("rooker")
  const { relTime } = useFormat()
  const uuid = useRookerUuid()

  const { data: chats, isLoading } = useQuery({
    queryKey: ["rooker", "dms", uuid],
    queryFn: async () => {
      const res = await ChatAppService.getChats()
      if (!res.success || !res.data) throw new Error(res.userMessage ?? t("messages.loadError"))
      return res.data.filter((c) => c.type === DIRECT)
    },
    enabled: Boolean(uuid),
  })

  if (!uuid) {
    return (
      <div>
        <SubHeader title={t("messages.title")} />
        <EmptyState icon="mail" title={t("common.loginRequiredTitle")} body={t("messages.loggedOutBody")} />
      </div>
    )
  }

  return (
    <div>
      <SubHeader
        title={t("messages.title")}
        subtitle={t("messages.subtitle")}
        right={
          <Link
            href="/smartrotom/chatapp"
            aria-label={t("messages.openChatApp")}
            className="grid h-[34px] w-[34px] place-items-center rounded-full text-rk-accent transition-colors hover:bg-rk-accent/12"
          >
            <Icon name="compose" size={19} />
          </Link>
        }
      />

      {isLoading ? (
        <FeedSkeleton rows={4} />
      ) : chats?.length ? (
        chats.map((chat: Chat) => {
          // A direct chat's "name" is the other person — find them by elimination
          // rather than trusting the chat's own title, which is often empty for DMs.
          const other = chat.members?.find((m) => m.uuid !== uuid)
          const last = chat.messages?.[chat.messages.length - 1]
          const unread = chat.unread > 0

          return (
            <Link
              key={chat.id}
              href={`/smartrotom/chatapp?chat=${chat.id}`}
              className={cn(
                "flex items-center gap-3 border-b border-rk-line px-4 py-3 transition-colors hover:bg-rk-hover",
                unread && "bg-rk-accent/[.06]",
              )}
            >
              <Avatar
                user={{
                  uuid: other?.uuid ?? "",
                  username: other?.username ?? chat.name ?? t("messages.fallbackUsername"),
                  partnerPokemonId: null,
                }}
                size={46}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[14.5px] font-bold text-rk-fg">
                    {other?.username ?? chat.name}
                  </span>
                  <span className="ml-auto flex-none text-[12.5px] text-rk-fg-subtle">
                    {relTime(last?.createdAt ?? chat.updatedAt)}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-0.5 truncate text-[13.5px]",
                    unread ? "font-semibold text-rk-fg" : "text-rk-fg-subtle",
                  )}
                >
                  {last?.content || t("messages.noMessagesYet")}
                </p>
              </div>
              {unread && <span className="h-2.5 w-2.5 flex-none rounded-full bg-rk-accent" />}
            </Link>
          )
        })
      ) : (
        <EmptyState
          icon="mail"
          title={t("messages.empty.title")}
          body={t("messages.empty.body")}
          action={
            <Link href="/smartrotom/chatapp">
              <Button intent="accent">{t("messages.openChatApp")}</Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
