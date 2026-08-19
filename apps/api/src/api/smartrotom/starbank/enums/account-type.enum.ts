import type { STARBANK_ACCOUNT_TYPES } from '@/_db/schema/SmartRotomStarBank';

export enum AccountType {
  MAIN = 'MAIN',
  SECONDARY = 'SECONDARY',
  // Where money enters and leaves the economy. An admin or game-driven setBalance mints
  // from it or burns into it, so its balance is the negative of all money in circulation.
  // It is NOT the state: civic money is GOVERNMENT. Seeded once; there is exactly one.
  SYSTEM = 'SYSTEM',
  // The treasury of Teras. Civic money settles against it: fines and taxes credit it,
  // bounty payouts and appeal refunds debit it. Seeded once; there is exactly one.
  GOVERNMENT = 'GOVERNMENT',
  // The Wigglypop marketplace escrow. A buyer's money sits here between "paid" and
  // "delivered": the buyer credits it, the seller (or a refunded buyer) is debited out of it.
  // Its balance is therefore money in flight plus the 2.5% fee the house has kept.
  // Seeded once; there is exactly one.
  MARKET = 'MARKET',
  // What an app charges for a service — the taxi's fares today. Unlike the types above there
  // is one row PER APP, told apart by `name`, so "what did the taxi earn" stays answerable
  // when the next money sink arrives without needing a new type and a new migration.
  SERVICE = 'SERVICE',
}

// The column is a MySQL enum built from STARBANK_ACCOUNT_TYPES. This assertion
// fails to compile if the two ever drift, which is the whole point of having the
// database hold the closed set rather than trusting inserts.
type _AccountTypeMatchesSchema =
  AccountType extends (typeof STARBANK_ACCOUNT_TYPES)[number] ? true : never;
const _accountTypeMatchesSchema: _AccountTypeMatchesSchema = true;
void _accountTypeMatchesSchema;
