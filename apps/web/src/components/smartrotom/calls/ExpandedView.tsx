import {
  PhoneIcon,
  ArrowsPointingInIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline"
import { type CallData, UserStatus } from "../types/call"
import { useEffect, useState, type ReactNode } from "react"

interface ExpandedViewProps {
  activeCall: CallData
  currentUserUuid: string
  onJoinCall: () => void
  onExitCall: () => void
  onCollapse: () => void
  callStartTime: number
}

export function ExpandedView({
  activeCall,
  currentUserUuid,
  onJoinCall,
  onExitCall,
  onCollapse,
  callStartTime,
}: ExpandedViewProps) {
  const usersInCall = activeCall.users.filter((u) => u.status === UserStatus.IN_CALL)
  const usersRinging = activeCall.users.filter((u) => u.status === UserStatus.RINGING)
  const [callDuration, setCallDuration] = useState("0:00")
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(true)
  const [speaker, setSpeaker] = useState(true)
  const currentUser = activeCall.users.find((u) => u.uuid === currentUserUuid)
  const isUserInCall = currentUser?.status === UserStatus.IN_CALL

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

  const statusMessage = isUserInCall
    ? callDuration
    : usersRinging.length > 0
      ? "Llamando…"
      : "Conectando…"

  const solo = activeCall.users.length <= 2

  return (
    <div className="flex h-full w-full flex-col text-[#e9edef]">
      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-2.5 px-5 pb-1.5 pt-5">
        <button
          onClick={onCollapse}
          title="Minimizar"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/[0.18]"
        >
          <ArrowsPointingInIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
        <div className="flex-1" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#c9d2d6] backdrop-blur-sm">
          <LockClosedIcon className="h-3.5 w-3.5" strokeWidth={2} /> Llamada cifrada de extremo a extremo
        </div>
        <div className="flex-1" />
      </div>

      {/* Stage */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className={`flex flex-wrap justify-center gap-8 ${solo ? "" : "max-w-3xl"}`}>
            {activeCall.users.map((user) => {
              const ring =
                user.status === UserStatus.IN_CALL
                  ? "border-white/35"
                  : user.status === UserStatus.RINGING
                    ? "border-[#25d366]"
                    : "border-[#f05454]/60"
              return (
                <div key={user.uuid} className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {user.status === UserStatus.RINGING && (
                      <span className="absolute inset-0 rounded-full border-2 border-[#25d366] motion-safe:animate-ping" />
                    )}
                    <img
                      src={`https://mc-heads.net/avatar/${user.uuid}`}
                      alt=""
                      className={`relative rounded-full border-2 object-cover shadow-[0_26px_70px_-20px_rgba(0,0,0,.8)] [image-rendering:pixelated] ${ring} ${solo ? "h-40 w-40" : "h-28 w-28"} ${user.status === UserStatus.IDLE ? "opacity-50" : ""}`}
                    />
                  </div>
                  <span className="max-w-[140px] truncate text-sm text-[#c9d2d6]">
                    {user.uuid === currentUserUuid ? "Tú" : user.username}
                  </span>
                </div>
              )
            })}
          </div>

          {solo && (
            <div className="text-[30px] font-semibold leading-none text-white">
              {activeCall.users.find((u) => u.uuid !== currentUserUuid)?.username || "Llamada"}
            </div>
          )}
          <div className="font-mono text-base tabular-nums text-[#c9d2d6]">{statusMessage}</div>
          {usersInCall.length > 1 && !solo && (
            <div className="text-sm text-[#8696a0]">{usersInCall.length} participantes</div>
          )}
        </div>
      </div>

      {/* Control dock */}
      <div className="relative z-10 flex flex-wrap items-start justify-center gap-3.5 px-5 pb-8 pt-4">
        <DockButton icon={<MicrophoneIcon className="h-[22px] w-[22px]" strokeWidth={2} />} label={muted ? "Silenciado" : "Silenciar"} on={muted} onClick={() => setMuted((v) => !v)} />
        <DockButton icon={<VideoCameraIcon className="h-[22px] w-[22px]" strokeWidth={2} />} label={camOff ? "Sin cámara" : "Cámara"} on={camOff} onClick={() => setCamOff((v) => !v)} />
        <DockButton icon={<SpeakerWaveIcon className="h-[22px] w-[22px]" strokeWidth={2} />} label="Altavoz" on={!speaker} onClick={() => setSpeaker((v) => !v)} />
        {currentUser?.status === UserStatus.RINGING && (
          <DockButton icon={<PhoneIcon className="h-[22px] w-[22px]" strokeWidth={2} />} label="Aceptar" variant="accept" onClick={onJoinCall} />
        )}
        <DockButton icon={<PhoneIcon className="h-[22px] w-[22px] rotate-[135deg]" strokeWidth={2} />} label="Colgar" variant="end" onClick={onExitCall} />
      </div>
    </div>
  )
}

function DockButton({
  icon,
  label,
  on,
  variant,
  onClick,
}: {
  icon: ReactNode
  label: string
  on?: boolean
  variant?: "end" | "accept"
  onClick: () => void
}) {
  const base = "grid h-14 w-14 place-items-center rounded-full backdrop-blur-sm transition-transform active:scale-90"
  const cls =
    variant === "end"
      ? "bg-[#f05454] text-white hover:brightness-110"
      : variant === "accept"
        ? "bg-[#25d366] text-white hover:brightness-110"
        : on
          ? "bg-white text-[#0b141a]"
          : "bg-white/[0.12] text-white hover:bg-white/20"
  return (
    <div className="flex w-16 flex-col items-center gap-2">
      <button onClick={onClick} title={label} className={`${base} ${cls}`}>
        {icon}
      </button>
      <span className="whitespace-nowrap text-[11.5px] text-[#aab4bb]">{label}</span>
    </div>
  )
}
