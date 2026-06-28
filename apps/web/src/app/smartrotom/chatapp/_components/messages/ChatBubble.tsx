import { cn } from "@/lib/utils"

interface ChatBubbleProps {
  message: string
  sender: "user" | "other"
  timestamp: string
}

export default function ChatBubble({ message, sender, timestamp }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-xs",
        sender === "user" ? "ml-auto justify-end" : "mr-auto justify-start"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col space-y-2 text-sm max-w-xs mx-2 px-4 py-3 rounded-xl",
          sender === "user"
            ? "bg-gradient-to-br from-primary-hover to-primary-active text-white"
            : "bg-layer-2 text-ink-dim"
        )}
      >
        <span className="break-words">{message}</span>
        <span
          className={cn(
            "text-xs opacity-50",
            sender === "user" ? "text-primary-hover" : "text-ink-muted"
          )}
        >
          {timestamp}
        </span>
        <div
          className={cn(
            "absolute bottom-0 w-3 h-3 transform",
            sender === "user"
              ? "-right-1 bg-primary-active rotate-45"
              : "-left-1 bg-layer-2 -rotate-45"
          )}
        />
      </div>
    </div>
  )
}