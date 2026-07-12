/** Local view-model types for the Starbank UI. Compatible with the shared
 *  `StarBankAccount` / `StarBankTransaction` (which carry these fields). */

export type AccountType = "MAIN" | "SECONDARY" | (string & {});

export interface SBAccount {
  id: number;
  name: string;
  balance: number;
  type: AccountType;
  image?: string;
}

export interface SBTransaction {
  from: number;
  to: number;
  amount: number;
  reason: string;
  date: string;
  fromBalance: number;
  toBalance: number;
  fromName?: string;
  toName?: string;
  fromType?: string;
  toType?: string;
  /** Counterparty (the "other side") as resolved by the API for this account. */
  displayName?: string;
  displayAccountType?: string;
  displayImage?: string;
  isPayer?: boolean;
  balance?: number;
}
