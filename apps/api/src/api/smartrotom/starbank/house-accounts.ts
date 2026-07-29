import { AccountType } from './enums/account-type.enum';

/**
 * The ownerless accounts the economy is built on.
 *
 * These have no row in `rotom_starbank_user_accounts` — no player owns them — and every other
 * money flow settles against one of them. They exist because a migration inserts them, not
 * because some service happened to be called first: an account that only appears on first use
 * is an account that can be missing exactly when the flow that needs it runs.
 *
 * `type` identifies the singletons; SERVICE accounts are one-per-app and are told apart by
 * `name`, so resolution is always (type, name).
 */
export interface HouseAccount {
  type: AccountType;
  /** Also the display name. `rotom_starbank_accounts.name` is varchar(32). */
  name: string;
  description: string;
}

/**
 * Mint/burn counterparty. Not the state — that is {@link TREASURY_ACCOUNT}, whose money comes
 * from and goes to players.
 *
 * Named for the region rather than for the machinery: this name is player-facing, because an
 * admin adjustment shows up in a ledger as coming from here, and "SYSTEM" reads as a glitch.
 */
export const SYSTEM_ACCOUNT: HouseAccount = {
  type: AccountType.SYSTEM,
  name: 'Teras',
  description:
    'Where money enters and leaves the economy (AJUSTE mint/burn). Its balance is the negative of all money in circulation.',
};

/** The state of Teras. Fines, taxes, bounties. */
export const TREASURY_ACCOUNT: HouseAccount = {
  type: AccountType.GOVERNMENT,
  // Deliberately not "Tesorería de Teras": in a transaction list it sat one prefix away from
  // the SYSTEM account's "Teras", and the two are entirely different kinds of money.
  name: 'Hacienda de Teras',
  description: 'Civic money: fines and taxes credit it, payouts debit it.',
};

/** Wigglypop's escrow: buyers' money in flight, plus the house fee. */
export const MARKET_ACCOUNT: HouseAccount = {
  type: AccountType.MARKET,
  name: 'Wigglypop Escrow',
  description:
    "A buyer's money between 'paid' and 'delivered', plus the 2.5% fee the house keeps.",
};

/** The taxi's fares. Was account 0 — i.e. burned — until this registry existed. */
export const TAXI_ACCOUNT: HouseAccount = {
  type: AccountType.SERVICE,
  name: 'Taxi de Teras',
  description: 'Fares collected by the taxi service.',
};

export const HOUSE_ACCOUNTS: readonly HouseAccount[] = [
  SYSTEM_ACCOUNT,
  TREASURY_ACCOUNT,
  MARKET_ACCOUNT,
  TAXI_ACCOUNT,
];

/** The types no player may own, and which must never appear in a player-facing account list. */
export const HOUSE_ACCOUNT_TYPES: readonly AccountType[] = [
  AccountType.SYSTEM,
  AccountType.GOVERNMENT,
  AccountType.MARKET,
  AccountType.SERVICE,
];

export function isHouseAccountType(type: string): boolean {
  return (HOUSE_ACCOUNT_TYPES as readonly string[]).includes(type);
}
