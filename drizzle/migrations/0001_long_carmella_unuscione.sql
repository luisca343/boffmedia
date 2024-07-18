ALTER TABLE `rotom_starbank_accounts` MODIFY COLUMN `balance` bigint;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` MODIFY COLUMN `amount` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` MODIFY COLUMN `from_balance` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` MODIFY COLUMN `to_balance` bigint NOT NULL;