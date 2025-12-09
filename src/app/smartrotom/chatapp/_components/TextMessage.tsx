import type { Message as MessageType } from "../_types/Chat"

interface TextMessageProps {
  message: MessageType
  content: string
  sender: "user" | "other"
  timestamp: string
  img: boolean
  isFirstInSequence: boolean
  isLastInSequence: boolean
}

export function TextMessage({
  message,
  content,
  sender,
  timestamp,
  img,
  isFirstInSequence,
  isLastInSequence,
}: TextMessageProps) {
  const getBubbleShape = () => {
    if (sender === "user") {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tl-3xl rounded-tr-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-bl-3xl rounded-br-lg"
      return "rounded-l-3xl rounded-r-lg"
    } else {
      if (isFirstInSequence && isLastInSequence) return "rounded-3xl"
      if (isLastInSequence) return "rounded-b-3xl rounded-tr-3xl rounded-tl-lg"
      if (isFirstInSequence) return "rounded-t-3xl rounded-br-3xl rounded-bl-lg"
      return "rounded-r-3xl rounded-l-lg"
    }
  }

  return (
    <div className={`flex w-full ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex flex-col mb-0.5 min-w-16  text-lg max-w-xl mx-8  ${
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
        <div
          className={`px-4 py-2  border-2 border-neutral-900 ${getBubbleShape()} ${
            sender === "user"
                ? "bg-primary-400 text-neutral-800"
                : "bg-surface-300 text-neutral-800"
          }`}
        >
          <span className="break-words">{content}</span>
        </div>
      </div>
    </div>
  )
}
