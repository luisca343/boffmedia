'use client';

interface TimerPlayerState {
  turnRemaining: number;
  totalRemaining: number;
}

interface TurnTimerProps {
  p1: TimerPlayerState;
  p2: TimerPlayerState;
  activeSide: 'p1' | 'p2' | null;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function TimerBar({ label, turnRemaining, totalRemaining, isActive }: {
  label: string;
  turnRemaining: number;
  totalRemaining: number;
  isActive: boolean;
}) {
  const turnPct = Math.max(0, (turnRemaining / 60_000) * 100);
  const totalPct = Math.max(0, (totalRemaining / 300_000) * 100);
  const isLow = turnRemaining < 10_000;

  return (
    <div className={`flex flex-col gap-0.5 px-2 py-1 rounded-md transition-all ${isActive ? 'bg-surface-800/80' : 'bg-surface-800/40 opacity-60'}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-surface-300">{label}</span>
        <span className={`font-mono font-bold ${isLow ? 'text-red-400 animate-pulse' : 'text-surface-100'}`}>
          {formatTime(turnRemaining)}
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : isActive ? 'bg-primary-500' : 'bg-surface-500'}`}
          style={{ width: `${turnPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-surface-500">
        <span>Total</span>
        <span>{formatTime(totalRemaining)}</span>
      </div>
      <div className="w-full h-0.5 bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-surface-500 rounded-full transition-all duration-1000"
          style={{ width: `${totalPct}%` }}
        />
      </div>
    </div>
  );
}

export function TurnTimer({ p1, p2, activeSide }: TurnTimerProps) {
  return (
    <div className="flex gap-2 w-full max-w-md mx-auto">
      <div className="flex-1">
        <TimerBar label="You" turnRemaining={p1.turnRemaining} totalRemaining={p1.totalRemaining} isActive={activeSide === 'p1'} />
      </div>
      <div className="flex-1">
        <TimerBar label="Bot" turnRemaining={p2.turnRemaining} totalRemaining={p2.totalRemaining} isActive={activeSide === 'p2'} />
      </div>
    </div>
  );
}
