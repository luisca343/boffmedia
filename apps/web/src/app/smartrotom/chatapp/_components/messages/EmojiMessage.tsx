import type { Message as MessageType } from "../../_types/Chat"

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
  function getEmojiCount(str: string) {
    if (!str) return 0
    try {
      const matches = str.match(/\p{Extended_Pictographic}/gu)
      return matches ? matches.length : 0
    } catch (e) {
      // Fallback for environments without Unicode property support
      return Array.from(str).length
    }
  }

  function containsTextCharacters(str: string) {
    try {
      return /\p{Letter}|\p{Number}/u.test(str)
    } catch (e) {
      return /[A-Za-z0-9]/.test(str)
    }
  }

  const emojiCount = getEmojiCount(content || "")
  const hasText = containsTextCharacters(content || "")

  const fontSize = hasText
    ? '1rem'
    : emojiCount <= 5
    ? '6rem'
    : emojiCount <= 8
    ? '5rem'
    : emojiCount <= 12
    ? '4rem'
    : emojiCount <= 20
    ? '3rem'
    : '2rem'

  const emojiStyle: React.CSSProperties = {
    fontSize,
    lineHeight: 1,
  }

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
          <span className={`text-xs ${sender === "user" ? "text-ink-muted self-end" : "text-ink-muted"} mb-1`}>
            {timestamp}
          </span>
        )}
        <div className="leading-tight" style={emojiStyle}>
          {content}
        </div>
      </div>
    </div>
  )
}
