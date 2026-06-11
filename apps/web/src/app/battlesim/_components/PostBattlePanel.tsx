'use client';

import Link from 'next/link';

interface PostBattlePanelProps {
  status: string;
  winner?: string | null;
  replayId?: number | null;
  onPlayAgain?: () => void;
  onRematch?: () => void;
}

export function PostBattlePanel({ status, winner, replayId, onPlayAgain, onRematch }: PostBattlePanelProps) {
  if (status !== 'finished') return null;

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      {winner && (
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {winner === 'tie' ? 'Draw!' : `${winner} wins!`}
        </span>
      )}
      {replayId && (
        <Link
          href={`/battlesim/replay/${replayId}`}
          className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          Watch Replay
        </Link>
      )}
      {onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          Play Again
        </button>
      )}
      {onRematch && (
        <button
          onClick={onRematch}
          className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          Rematch
        </button>
      )}
    </div>
  );
}
