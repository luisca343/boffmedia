'use client';

import type { ReactNode } from 'react';

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
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={hint ? `${label} (${hint})` : label}
      className="bsx-focus flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-[var(--radius-sm)] transition-colors duration-[var(--dur-fast)] cursor-pointer"
      style={{
        background: active ? 'color-mix(in srgb, var(--accent) 18%, var(--surface-2))' : 'var(--surface-2)',
        color: active ? 'var(--accent-bright)' : 'var(--text-muted)',
        border: `1px solid ${active ? 'color-mix(in srgb, var(--accent) 45%, var(--border))' : 'var(--border)'}`,
      }}
    >
      {children}
      {hint && (
        <span className="font-mono text-t-4xs tracking-[.04em]" style={{ color: 'var(--text-dim)' }}>
          {hint}
        </span>
      )}
    </button>
  );
}
