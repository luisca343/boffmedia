"use client"

import * as React from "react"
import { useVisiblePoll } from "@/hooks/useVisiblePoll"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, toast } from "@boffmedia/ui"
import { useBoffSession } from "@/services/useBoffSession"
import { TM_CARD, TM_CARD_HEAD, TM_CARD_H3 } from "@/components/boffmedia/ui/tournaments"
import { TournamentsService, type TnMatchDetailApi, type TnMatchMessageApi } from "@/services/api/boffmedia/tournamentsService"

export function LiveMatchChat({
  detail,
  onChanged,
}: {
  detail: TnMatchDetailApi
  onChanged: () => void
}) {
  const t = useTranslations("torneos.chat")
  const { session } = useBoffSession()
  const meUserId = session?.user?.id ? Number(session.user.id) : null
  const [msgs, setMsgs] = React.useState<TnMatchMessageApi[]>([])
  const [loadError, setLoadError] = React.useState(false)
  const [input, setInput] = React.useState("")
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const lastId = msgs.length ? msgs[msgs.length - 1].id : 0

  const load = React.useCallback(async () => {
    const r = await TournamentsService.getMessages(detail.tournamentId, detail.id, 0)
    // An empty chat and a chat that failed to load look identical, so a lost
    // session used to read as "nobody has said anything".
    if (r.success && r.data) {
      setMsgs(r.data)
      setLoadError(false)
    } else {
      setLoadError(true)
    }
  }, [detail.tournamentId, detail.id])
  React.useEffect(() => {
    load()
  }, [load])

  useVisiblePoll(
    React.useCallback(async () => {
      const r = await TournamentsService.getMessages(detail.tournamentId, detail.id, lastId)
      if (r.data?.length) setMsgs((cur) => [...cur, ...r.data!.filter((m) => !cur.some((c) => c.id === m.id))])
    }, [detail.tournamentId, detail.id, lastId]),
    8000
  )

  React.useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const send = async () => {
    const v = input.trim()
    if (!v) return
    setInput("")
    const r = await TournamentsService.postMessage(detail.tournamentId, detail.id, v)
    if (r.error) toast.error(r.error)
    else if (r.data) setMsgs((cur) => [...cur, r.data!])
  }
  const judge = async () => {
    const r = await TournamentsService.requestJudge(detail.tournamentId, detail.id)
    if (r.error) toast.error(r.error)
    else {
      toast(t("judgeToast"))
      onChanged()
      load()
    }
  }
  const judgeRequested = detail.judgeRequestedAt != null

  const hm = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  return (
    <section className={TM_CARD}>
      <div className={TM_CARD_HEAD}>
        <h3 className={TM_CARD_H3}>{t("title")}</h3>
        <Button variant="default" size="sm" icon="alert" disabled={judgeRequested} onClick={judge} className={cn(!judgeRequested && "border-warn text-warn hover:border-warn hover:bg-warn hover:text-white")}>
          {judgeRequested ? t("judgeRequested") : t("requestJudge")}
        </Button>
      </div>
      <div ref={bodyRef} className="flex h-[320px] flex-col gap-2.5 overflow-y-auto bg-base p-4">
        {msgs.length === 0 && (
          <p className="m-auto font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">
            {loadError ? t("loadFailed") : t("empty")}
          </p>
        )}
        {msgs.map((m) => {
          if (m.kind === "sys")
            return (
              <div key={m.id} className="mx-auto inline-flex max-w-[82%] items-center gap-2 border border-solid border-[color:color-mix(in_srgb,var(--info)_25%,transparent)] bg-info-soft px-3 py-1.5 text-center font-body text-[11.5px]/[1.3] font-medium text-txt-muted">
                <span className="font-mono text-[10px]/none font-semibold text-info">{hm(m.createdAt)}</span>
                {m.body}
              </div>
            )
          const isMe = m.authorUserId != null && m.authorUserId === meUserId
          const isJudge = m.kind === "judge"
          return (
            <div key={m.id} className={cn("flex max-w-[82%]", isMe ? "self-end" : "self-start")}>
              <div className={cn("grid gap-[3px] border border-solid px-3 py-2", isMe ? "border-accent-line bg-accent-soft" : isJudge ? "border-[color:color-mix(in_srgb,var(--warn)_35%,transparent)] bg-warn-soft" : "border-line bg-panel-2")}>
                <div className="flex items-baseline gap-2">
                  <b className={cn("font-mono text-[11px]/none font-bold", isMe ? "text-accent-bright" : isJudge ? "text-warn" : "text-txt")}>
                    {isJudge ? `${m.authorName ?? t("judgeFallback")} · ${t("judgeSuffix")}` : m.authorName ?? t("playerFallback")}
                  </b>
                  <i className="font-mono text-[10px]/none not-italic text-txt-dim">{hm(m.createdAt)}</i>
                </div>
                <p className="m-0 break-words font-body text-[13.5px]/[1.45] text-txt">{m.body}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2.5 border-t border-solid border-line bg-panel px-4 py-3">
        <input
          className="min-w-0 flex-1 border border-solid border-line-2 bg-base px-3 py-2.5 font-body text-[13.5px]/[1.3] text-txt focus:border-accent-line focus:outline focus:outline-2 focus:outline-accent-line"
          value={input}
          placeholder={t("placeholder")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send() }}
        />
        <Button variant="pri" size="sm" icon="arrow" onClick={send}>{t("send")}</Button>
      </div>
    </section>
  )
}
