import type { ReactNode } from "react"
import { Avatar } from "../ui"

// The compact citizen line: avatar, name, a mono subline, an optional trailing value.
// Shared by the Más buscados panel and anywhere else Inicio surfaces a short list of people.
export function CitizenRow({
  username,
  sub,
  onClick,
  right,
}: {
  username: string
  sub?: string
  onClick?: () => void
  right?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-gt-sm border border-transparent px-2 py-[7px] text-left transition-colors hover:bg-gt-paper-1"
    >
      <Avatar user={username} size={30} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold text-gt-ink-900">{username}</div>
        {sub && <div className="truncate font-gt-mono text-[10px] text-gt-ink-400">{sub}</div>}
      </div>
      {right}
    </button>
  )
}
