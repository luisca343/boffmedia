'use client';

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { BSIM_FOCUS_CUT } from '../bsim-kit';

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
        // 32px minimum: these are the primary controls of the replay viewer
        // and were a 28px target with no focus ring at all.
        'flex min-h-8 min-w-8 cursor-pointer flex-col items-center justify-center gap-0.5 border border-solid px-2 py-1.5',
        // `cut-tag` + the tool's press feedback: every other control in the
        // tool is a chamfered box that dips a pixel when you press it. These
        // were the one square, static family left, sitting under a chamfered
        // canvas and beside a chamfered segmented control.
        'cut-tag cut-tag-edge [--cut-tag:6px] transition-[background,border-color,color,transform] duration-[140ms] active:translate-y-px motion-reduce:active:translate-y-0',
        // An outline on a clipped box is clipped away with the corner it marks,
        // so the ring has to be the shape's own edge stroke.
        BSIM_FOCUS_CUT,
        active
          ? 'border-accent-line [--cut-line:var(--accent-line)] bg-accent-soft text-accent-bright'
          : 'border-line-2 [--cut-line:var(--line-2)] bg-base text-txt-muted hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-txt',
      )}
    >
      {children}
      {hint && <span className="font-mono text-[9px]/none font-semibold tracking-[0.06em] text-txt-dim">{hint}</span>}
    </button>
  );
}
