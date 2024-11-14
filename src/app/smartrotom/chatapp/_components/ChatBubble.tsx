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
            ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
            : "bg-main-200 text-main-900"
        )}
      >
        <span className="break-words">{message}</span>
        <span
          className={cn(
            "text-xs opacity-50",
            sender === "user" ? "text-orange-100" : "text-main-500"
          )}
        >
          {timestamp}
        </span>
        <div
          className={cn(
            "absolute bottom-0 w-3 h-3 transform",
            sender === "user"
              ? "-right-1 bg-orange-600 rotate-45"
              : "-left-1 bg-main-200 -rotate-45"
          )}
        />
      </div>
    </div>
  )
}