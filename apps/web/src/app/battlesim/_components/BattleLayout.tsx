"use client"
import type { ReactNode } from "react"

interface BattleLayoutProps {
  children: ReactNode
  header?: ReactNode
  rightPanel?: ReactNode
  switchBench?: ReactNode
  forcedSwitch?: ReactNode
  teamPreview?: ReactNode
  postBattle?: ReactNode
  turnText?: string
  isWaiting?: boolean
  status?: string
  turn?: number
}

export function BattleLayout({
  children,
  header,
  rightPanel,
  switchBench,
  forcedSwitch,
  teamPreview,
  postBattle,
  turnText,
  isWaiting,
  status,
  turn,
}: BattleLayoutProps) {
  return (
    <div className="flex flex-col gap-4 p-4" style={{ color: 'var(--text)', background: 'var(--bg)' }}>
      {header}

      <div className="flex gap-4">
        <div className="flex flex-col relative shrink-0">{children}</div>
        {rightPanel && <div className="flex-1 min-w-0">{rightPanel}</div>}
      </div>

      {switchBench}
      {forcedSwitch}
      {teamPreview}

      {status === 'active' && turn != null && turn > 0 && (
        <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {turnText}
          {isWaiting && ' — Your turn!'}
        </div>
      )}

      {postBattle}
    </div>
  )
}
