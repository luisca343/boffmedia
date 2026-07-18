import type { SBAccount, SBTransaction } from "../_types";

export const AVATAR_FALLBACK = "/smartrotom/img/apps/starbank/cuentas/Teras.png";

/** Resolve an avatar URL the same way the legacy AccountImage did:
 *  MAIN → Minecraft head; SECONDARY → uploaded image or name-based path. */
export function accountImageUrl(type?: string, name?: string, image?: string): string {
  if (type === "SECONDARY") {
    // Exact account name: the files in public/…/cuentas/ keep their original
    // casing, and this runs on a case-sensitive filesystem in prod.
    return image || `/smartrotom/img/apps/starbank/cuentas/${name ?? ""}.png`;
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

/** Why this transfer cannot be sent, or `null` when it can. The API is the real
 *  authority; this only stops the obviously-doomed request from leaving. */
export type TransferBlock = "amount" | "funds" | "same-account" | "no-source";

export function transferBlocker(opts: {
  amount: number;
  fromId?: number;
  toId?: number;
  balance?: number;
}): TransferBlock | null {
  const { amount, fromId, toId, balance } = opts;
  if (fromId == null || balance == null) return "no-source";
  if (!Number.isFinite(amount) || amount <= 0) return "amount";
  if (toId != null && toId === fromId) return "same-account";
  if (amount > balance) return "funds";
  return null;
}
