"use client";

import { Button } from "./Button";
import { FurretMascot } from "./FurretMascot";

/** Dotted rule — the magazine's only divider. */
export function Divider({ className }: { className?: string }) {
  return (
    <hr
      className={`my-6 border-0 border-t-[3px] border-dotted border-ft-ink ${className ?? ""}`}
    />
  );
}

/** Shimmering ink-outlined block, for anything still loading. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`ft-skel animate-ft-shimmer motion-reduce:animate-none ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Nothing to show. Furret says so, and offers the way out. */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={[
        "border-ft rounded-ft-lg border-ft-ink bg-ft-yellow p-10 text-center shadow-ft-pop",
        className ?? "",
      ].join(" ")}
    >
      <FurretMascot size={140} className="mx-auto" />
      <h3 className="font-ft-display mt-2 text-[2.75rem] leading-none">{title}</h3>
      <p className="font-ft-deck mx-auto mt-1 max-w-[480px] text-xl italic text-ft-ink/85">
        {message}
      </p>
      {actionLabel && onAction ? (
        <Button variant="primary" size="lg" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

/** The editor's colour-coded counters. */
export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "lime" | "pink" | "yellow";
}) {
  const TONE = {
    cyan: "bg-ft-cyan text-ft-ink",
    lime: "bg-ft-lime text-ft-ink",
    pink: "bg-ft-pink text-white",
    yellow: "bg-ft-yellow text-ft-ink",
  } as const;

  return (
    <div
      className={`border-ft rounded-ft min-w-[72px] border-ft-ink px-3.5 py-2 text-center shadow-ft-pop-sm ${TONE[tone]}`}
    >
      <div className="font-ft-display text-3xl leading-none">{value}</div>
      <div className="font-ft-ui mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em]">
        {label}
      </div>
    </div>
  );
}
