-- House accounts: the ownerless accounts every money flow settles against.
-- Data-only migration; no schema change, hence no new snapshot.
--
-- Why a migration and not just `pnpm seed`: these accounts were previously created lazily on
-- first use (MARKET) or by one app's seed script (GOVERNMENT), and the mint/burn counterparty
-- was the literal id 0 — which cannot exist, because rotom_starbank_transactions.from/to are
-- FK'd to rotom_starbank_accounts.id and that column is AUTO_INCREMENT (starts at 1). Every
-- AJUSTE write therefore violated the FK. Seeding a real SYSTEM row is what fixes it.
--
-- Idempotent: singleton types guard on `type`, so an already-seeded treasury or a lazily
-- created escrow is left exactly as it is. SERVICE is one row per app, so it guards on both.

-- Named 'Teras' (the region), not 'Sistema': this name is player-facing — an admin balance
-- adjustment shows up in a ledger as coming from here. The `type` stays SYSTEM, which is what
-- the ledger code keys on.
INSERT INTO `rotom_starbank_accounts` (`name`, `balance`, `type`)
SELECT 'Teras', 0, 'SYSTEM' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rotom_starbank_accounts` WHERE `type` = 'SYSTEM');
--> statement-breakpoint
INSERT INTO `rotom_starbank_accounts` (`name`, `balance`, `type`)
SELECT 'Hacienda de Teras', 0, 'GOVERNMENT' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rotom_starbank_accounts` WHERE `type` = 'GOVERNMENT');
--> statement-breakpoint
-- The treasury may already exist under its old name, seeded by seed/gobierno.ts before this
-- registry existed. Rename rather than insert a second one: "Tesorería de Teras" sat one prefix
-- away from the SYSTEM account's "Teras" in a transaction list, and they are entirely different
-- kinds of money. Balances and ledger rows are untouched — only the display name moves.
UPDATE `rotom_starbank_accounts`
SET `name` = 'Hacienda de Teras'
WHERE `type` = 'GOVERNMENT' AND `name` <> 'Hacienda de Teras';
--> statement-breakpoint
INSERT INTO `rotom_starbank_accounts` (`name`, `balance`, `type`)
SELECT 'Wigglypop Escrow', 0, 'MARKET' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `rotom_starbank_accounts` WHERE `type` = 'MARKET');
--> statement-breakpoint
INSERT INTO `rotom_starbank_accounts` (`name`, `balance`, `type`)
SELECT 'Taxi de Teras', 0, 'SERVICE' FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `rotom_starbank_accounts`
  WHERE `type` = 'SERVICE' AND `name` = 'Taxi de Teras'
);
