import type { Message as MessageType } from "../../_types/Chat"

interface StickerMessageProps {
  message: MessageType
  content: string
  sender: "user" | "other"
  timestamp: string
  img: boolean
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function StickerMessage({
  message,
  content,
  sender,
  timestamp,
  img,
  isFirstInSequence,
  isLastInSequence,
}: StickerMessageProps) {
  return (
    <div className={`flex w-full ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex flex-col mb-0.5 min-w-16 max-w-xl mx-8 ${
          isLastInSequence ? "mb-1" : ""
        } ${isFirstInSequence ? "mt-1" : ""}`}
      >
        {sender !== "user" && img && isLastInSequence && (
          <img
            src={`https://mc-heads.net/avatar/${message.uuid}`}
            alt={`profile picture for ${message.uuid}`}
            className="w-10 h-10 rounded-full absolute -left-6 -bottom-4"
          />
        )}
        {isFirstInSequence && (
          <span className={`text-xs ${sender === "user" ? "text-ink-muted self-end" : "text-ink-muted"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div className="w-48 h-48">
          <img
            src={content}
            alt="sticker"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}
