export enum AccountType {
  MAIN = 'MAIN',
  SECONDARY = 'SECONDARY',
  // The treasury of Teras. Civic money settles against it: fines and taxes credit it,
  // bounty payouts and appeal refunds debit it. Seeded once; there is exactly one.
  GOVERNMENT = 'GOVERNMENT',
}
