import type { Message as MessageType } from "../_types/Chat"

interface EmojiMessageProps {
  message: MessageType
  content: string
  sender: "user" | "other"
  timestamp: string
  img: boolean
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function EmojiMessage({
  message,
  content,
  sender,
  timestamp,
  img,
  isFirstInSequence,
  isLastInSequence,
}: EmojiMessageProps) {
  return (
    <div className={`flex w-full ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex flex-col mb-0.5 text-lg mx-8 ${
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
          <span className={`text-xs ${sender === "user" ? "text-surface-400 self-end" : "text-surface-500"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div className="text-5xl leading-tight">
          {content}
        </div>
      </div>
    </div>
  )
}
