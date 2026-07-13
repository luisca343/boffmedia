export enum AccountType {
  MAIN = 'MAIN',
  SECONDARY = 'SECONDARY',
  // The treasury of Teras. Civic money settles against it: fines and taxes credit it,
  // bounty payouts and appeal refunds debit it. Seeded once; there is exactly one.
  GOVERNMENT = 'GOVERNMENT',
  // The Wigglypop marketplace escrow. A buyer's money sits here between "paid" and
  // "delivered": the buyer credits it, the seller (or a refunded buyer) is debited out of it.
  // Its balance is therefore money in flight plus the 2.5% fee the house has kept.
  // Seeded once; there is exactly one.
  MARKET = 'MARKET',
}
