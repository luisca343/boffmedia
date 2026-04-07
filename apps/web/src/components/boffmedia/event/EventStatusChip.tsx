import { Event } from "@boffmedia/shared";
import { BOFF_VARIANTS } from "@/components/boffmedia/tools/utils/boffVariants";

// ─── Token map ────────────────────────────────────────────────────────────────
// Maps Event.status to visual tokens derived from BOFF_VARIANTS where they
// semantically align, so chip colours stay in sync with the wider design system.
//
//   ACTIVE    → highlight (lime-green) — "go / live"
//   UPCOMING  → secondary (cyan)       — "pending / soon"
//   COMPLETED → custom muted           — "done / off"

type StatusTokens = {
  label: string;
  color: string;    // CSS text + dot colour
  border: string;   // CSS border colour
  bg: string;       // CSS background colour
  pulse: boolean;
};

const H = BOFF_VARIANTS.highlight;
const S = BOFF_VARIANTS.secondary;

const STATUS_TOKENS: Record<string, StatusTokens> = {
  [Event.status.ACTIVE]: {
    label: "En Vivo",
    color: H.text,
    border: H.border,
    bg: H.tint,
    pulse: true,
  },
  [Event.status.UPCOMING]: {
    label: "Próximo",
    color: S.text,
    border: S.border,
    bg: S.tint,
    pulse: false,
  },
  [Event.status.COMPLETED]: {
    label: "Finalizado",
    color: "rgba(100,116,139,0.8)",
    border: "rgba(71,85,105,0.35)",
    bg: "rgba(71,85,105,0.07)",
    pulse: false,
  },
};

const FALLBACK: StatusTokens = STATUS_TOKENS[Event.status.COMPLETED];

// ─── Component ───────────────────────────────────────────────────────────────

interface EventStatusChipProps {
  status: Event.status | string;
  /** Override the display label */
  label?: string;
  className?: string;
}

export function EventStatusChip({ status, label, className = "" }: EventStatusChipProps) {
  const tokens = STATUS_TOKENS[status] ?? FALLBACK;
  const displayLabel = label ?? tokens.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest flex-shrink-0 ${className}`}
      style={{
        color: tokens.color,
        border: `1px solid ${tokens.border}`,
        background: tokens.bg,
      }}
    >
      {tokens.pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
          style={{ background: tokens.color }}
        />
      )}
      {displayLabel}
    </span>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function getStatusTokens(status: Event.status | string): StatusTokens {
  return STATUS_TOKENS[status] ?? FALLBACK;
}
