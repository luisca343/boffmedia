import { PhoneIcon, Maximize2Icon, MicIcon } from "lucide-react"
import { type CallData, UserStatus } from "../types/call"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"

interface CollapsedViewProps {
  activeCall: CallData
  currentUserUuid: string
  onJoinCall: () => void
  onExitCall: () => void
  onExpand: () => void
  callStartTime: number
}

export function CollapsedView({
  activeCall,
  currentUserUuid,
  onJoinCall,
  onExitCall,
  onExpand,
  callStartTime,
}: CollapsedViewProps) {
  const t = useTranslations("smartrotom.calls")
  const [callDuration, setCallDuration] = useState("0:00")
  const [muted, setMuted] = useState(false)
  const currentUser = activeCall.users.find((user) => user.uuid === currentUserUuid)
  const isUserInCall = currentUser?.status === UserStatus.IN_CALL
  const isUserRinging = currentUser?.status === UserStatus.RINGING
  const usersInCall = activeCall.users.filter((user) => user.status === UserStatus.IN_CALL)
  const caller = activeCall.users.find((u) => u.uuid === activeCall.caller)
  const name = activeCall.caller === currentUserUuid ? t("yourCall") : caller?.username || "Llamada"

  useEffect(() => {
    if (!isUserInCall || !callStartTime) return
    const update = () => {
      const s = Math.floor((Date.now() - callStartTime) / 1000)
      setCallDuration(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [callStartTime, isUserInCall])

  const status = isUserRinging ? t("incoming") : isUserInCall ? callDuration : t("calling")

  return (
    <div className="flex w-full items-center gap-3 px-3 py-2.5">
      <div className="relative h-11 w-11 flex-none overflow-hidden rounded-full bg-[#2a3942]">
        <img src={`https://mc-heads.net/avatar/${activeCall.caller}`} alt="" className="h-full w-full object-cover [image-rendering:pixelated]" />
        {isUserInCall && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111b21] bg-[#25d366]" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[#e9edef]">{name}</div>
        <div className="flex items-center gap-1.5 text-[0.71875rem] text-[#8696a0]">
          <PhoneIcon className="h-3 w-3 flex-none" strokeWidth={2} />
          <span className="font-mono tabular-nums" style={{ color: "#53d3a0" }}>{status}</span>
          {usersInCall.length > 1 && <span>· {usersInCall.length}</span>}
        </div>
      </div>

      <button
        onClick={() => setMuted((v) => !v)}
        title={t("mute")}
        className={`grid h-9 w-9 flex-none place-items-center rounded-full transition-colors ${muted ? "bg-[#00a884] text-white" : "bg-white/[0.14] text-[#e9edef] hover:bg-white/[0.24]"}`}
      >
        <MicIcon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
      </button>

      {isUserRinging && (
        <button onClick={onJoinCall} title={t("accept")} className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#25d366] text-white transition-transform hover:brightness-110 active:scale-90">
          <PhoneIcon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
        </button>
      )}

      <button onClick={onExitCall} title={t("hangUp")} className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#f05454] text-white transition-transform hover:brightness-110 active:scale-90">
        <PhoneIcon className="h-[1.125rem] w-[1.125rem] rotate-[135deg]" strokeWidth={2} />
      </button>

      <button onClick={onExpand} title={t("expand")} className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/[0.14] text-[#e9edef] transition-colors hover:bg-white/[0.24]">
        <Maximize2Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
      </button>
    </div>
  )
}
