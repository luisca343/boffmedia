import type { SBAccount, SBTransaction } from "../_types";

export const AVATAR_FALLBACK = "/smartrotom/img/apps/starbank/cuentas/teras.png";

/** Resolve an avatar URL the same way the legacy AccountImage did:
 *  MAIN → Minecraft head; SECONDARY → uploaded image or name-based path. */
export function accountImageUrl(type?: string, name?: string, image?: string): string {
  if (type === "SECONDARY") {
    return image || `/smartrotom/img/apps/starbank/cuentas/${(name ?? "").toLowerCase()}.png`;
  }
  return `https://minotar.net/avatar/${name ?? ""}/80.png`;
}

export function isMain(account?: Pick<SBAccount, "type">): boolean {
  return account?.type === "MAIN";
}

export function initials(name?: string): string {
  if (!name) return "?";
  const cleaned = name.replace(/[_-]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? parts[0][0] + parts[1][0]
      : cleaned.replace(/[^A-Za-z0-9]/g, "").slice(0, 2);
  return (letters || "?").toUpperCase();
}

const PALETTE = ["#2463eb", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899"];

/** Deterministic accent colour for an account/pot without one in the API. */
export function accountColor(seed: string | number): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Active account's running balance after a transaction (from its perspective). */
export function balanceAfter(tx: SBTransaction, accountId: number): number {
  return tx.from === accountId ? tx.fromBalance : tx.toBalance;
}

/** Is the given account the payer (outgoing) for this transaction. */
export function isOutgoing(tx: SBTransaction, accountId?: number): boolean {
  if (accountId != null) return tx.from === accountId;
  return !!tx.isPayer;
}

export function displayName(name?: string): string {
  return (name ?? "").replace(/_/g, " ");
}
