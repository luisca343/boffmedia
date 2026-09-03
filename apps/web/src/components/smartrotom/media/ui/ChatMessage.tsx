import { cn } from "@/lib/utils"
import { I } from "./icons"

export interface ChatMessageData {
  id?: string
  user: string
  color?: string
  msg: string
  mod?: boolean
  verified?: boolean
  system?: boolean
  you?: boolean
}

/** One chat line: badges (MOD / verified / system / you) + coloured user + msg. */
export function ChatMessage({ m }: { m: ChatMessageData }) {
  if (m.system) {
    return (
      <div className="my-0.5 -mx-1.5 flex items-center gap-1.5 rounded-md bg-mw-highlight/[.14] px-1.5 py-1 text-xs italic text-mw-highlight animate-mw-fade-in">
        <I.sparkles size={12} /> {m.msg}
      </div>
    )
  }
  return (
    <div
      className={cn(
        "my-0.5 -mx-1.5 break-words rounded-md px-1.5 py-1 text-[0.8125rem] leading-[1.45] hover:bg-mw-800 animate-mw-fade-in",
        m.you && "bg-mw-accent/[.14]",
      )}
    >
      {m.mod && (
        <span className="mr-1 inline-flex items-center rounded-[3px] bg-mw-highlight px-1.5 py-px align-middle text-[0.5625rem] font-extrabold tracking-[0.05em] text-black">
          MOD
        </span>
      )}
      {m.verified && (
        <span className="mr-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-mw-accent align-middle text-white">
          <I.check size={9} />
        </span>
      )}
      <span className="font-bold" style={{ color: m.color }}>
        {m.user}
      </span>
      <span className="mx-1 text-mw-fg-faint">:</span>
      <span className="text-mw-fg">{m.msg}</span>
    </div>
  )
}
