"use client"

import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react"
import type { Message as MessageType, CallMessageData } from "../../_types/Chat"

interface CallMessageProps {
  callData: CallMessageData
  sender: "system" | "user" | "other"
  timestamp: string
  isSender: boolean
  img: boolean
  message: MessageType
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function CallMessage({
  callData,
  sender,
  timestamp,
  isSender,
  img,
  message,
  isFirstInSequence,
  isLastInSequence,
}: CallMessageProps) {
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "No contestada"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const getCallIcon = () => {
    if (callData.duration === 0) {
      return <PhoneMissed className="h-5 w-5 text-red-400" />
    }
    return <Phone className="h-5 w-5 text-warning-hover" />
  }

  const getCallStatus = () => {
    if (callData.duration === 0) {
      return "Llamada perdida"
    }
    return "Llamada"
  }

  return (
    <div className="flex justify-center w-full my-2">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-800/60 backdrop-blur-sm border border-neutral-900/50 rounded-full shadow-sm">
        {/* Call Icon */}
        <div className="flex-shrink-0">
          {getCallIcon()}
        </div>

        {/* Call Info */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-neutral-100">
            {getCallStatus()}
          </span>
          <span className={`text-xs ${callData.duration === 0 ? 'text-red-400' : 'text-neutral-400'}`}>
            {formatDuration(callData.duration)}
          </span>
        </div>

        {/* Timestamp */}
        {isFirstInSequence && (
          <span className="text-[10px] text-neutral-500 ml-2">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  )
}
