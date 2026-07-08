'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function ReplayControlsButton({
  onClick,
  label,
  children,
  active,
  hint,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  /** Toggled/engaged state. */
  active?: boolean;
  /** Keyboard hint shown under the icon (e.g. "Space"). */
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={hint ? `${label} (${hint})` : label}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-0.5 border border-solid px-2 py-1.5 transition-colors focus-visible:outline-none',
        active
          ? 'border-accent-line bg-accent-soft text-accent-bright'
          : 'border-line-2 bg-base text-txt-muted hover:border-accent-line hover:text-txt',
      )}
    >
      {children}
      {hint && <span className="font-mono text-[8px] tracking-[0.04em] text-txt-dim">{hint}</span>}
    </button>
  );
}
