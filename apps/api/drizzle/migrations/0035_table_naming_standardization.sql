-- Naming standardization. Two rules are being applied:
--   1. Every SmartRotom table lives under the `rotom_` prefix. Gobierno (25) and
--      Wigglypop (11) were the only SmartRotom systems outside it, so 45% of the
--      SmartRotom surface did not answer `SHOW TABLES LIKE 'rotom_%'`.
--   2. A table's name matches the product that owns it (StarBank was `rotom_bank_*`)
--      and junction tables read `<owner>_<owned>` with a singular modifier.
--
-- InnoDB carries foreign keys and indexes across RENAME TABLE automatically, so
-- no constraint has to be dropped and recreated here. Verified before writing
-- this: no raw SQL anywhere in apps/api references these names — the one place
-- that did (wigglypop-listings.repository.ts findSalePricesByDex) was rewritten
-- onto the schema objects in the same change.

-- ─── Gobierno de Teras → rotom_gobierno_* ────────────────────────────────────
RENAME TABLE `gobierno_zonas` TO `rotom_gobierno_zonas`;--> statement-breakpoint
RENAME TABLE `gobierno_parcelas` TO `rotom_gobierno_parcelas`;--> statement-breakpoint
RENAME TABLE `gobierno_parcela_historial` TO `rotom_gobierno_parcela_historial`;--> statement-breakpoint
RENAME TABLE `gobierno_subastas` TO `rotom_gobierno_subastas`;--> statement-breakpoint
RENAME TABLE `gobierno_pujas` TO `rotom_gobierno_pujas`;--> statement-breakpoint
RENAME TABLE `gobierno_denuncias` TO `rotom_gobierno_denuncias`;--> statement-breakpoint
RENAME TABLE `gobierno_buscados` TO `rotom_gobierno_buscados`;--> statement-breakpoint
RENAME TABLE `gobierno_patrullas` TO `rotom_gobierno_patrullas`;--> statement-breakpoint
RENAME TABLE `gobierno_patrulla_oficiales` TO `rotom_gobierno_patrulla_oficiales`;--> statement-breakpoint
RENAME TABLE `gobierno_bitacora` TO `rotom_gobierno_bitacora`;--> statement-breakpoint
RENAME TABLE `gobierno_multas` TO `rotom_gobierno_multas`;--> statement-breakpoint
RENAME TABLE `gobierno_tasas` TO `rotom_gobierno_tasas`;--> statement-breakpoint
RENAME TABLE `gobierno_expedientes` TO `rotom_gobierno_expedientes`;--> statement-breakpoint
RENAME TABLE `gobierno_expediente_eventos` TO `rotom_gobierno_expediente_eventos`;--> statement-breakpoint
RENAME TABLE `gobierno_apelaciones` TO `rotom_gobierno_apelaciones`;--> statement-breakpoint
RENAME TABLE `gobierno_anuncios` TO `rotom_gobierno_anuncios`;--> statement-breakpoint
RENAME TABLE `gobierno_auditoria` TO `rotom_gobierno_auditoria`;--> statement-breakpoint
RENAME TABLE `gobierno_eventos` TO `rotom_gobierno_eventos`;--> statement-breakpoint
RENAME TABLE `gobierno_evento_obras` TO `rotom_gobierno_evento_obras`;--> statement-breakpoint
RENAME TABLE `gobierno_evento_votos` TO `rotom_gobierno_evento_votos`;--> statement-breakpoint
RENAME TABLE `gobierno_evento_especies` TO `rotom_gobierno_evento_especies`;--> statement-breakpoint
RENAME TABLE `gobierno_evento_capturas` TO `rotom_gobierno_evento_capturas`;--> statement-breakpoint
RENAME TABLE `gobierno_npc_skins` TO `rotom_gobierno_npc_skins`;--> statement-breakpoint
RENAME TABLE `gobierno_megafonia` TO `rotom_gobierno_megafonia`;--> statement-breakpoint
RENAME TABLE `gobierno_carteles` TO `rotom_gobierno_carteles`;--> statement-breakpoint

-- ─── Wigglypop → rotom_wigglypop_* ───────────────────────────────────────────
RENAME TABLE `wigglypop_listings` TO `rotom_wigglypop_listings`;--> statement-breakpoint
RENAME TABLE `wigglypop_listing_mons` TO `rotom_wigglypop_listing_mons`;--> statement-breakpoint
RENAME TABLE `wigglypop_listing_items` TO `rotom_wigglypop_listing_items`;--> statement-breakpoint
RENAME TABLE `wigglypop_orders` TO `rotom_wigglypop_orders`;--> statement-breakpoint
RENAME TABLE `wigglypop_order_lines` TO `rotom_wigglypop_order_lines`;--> statement-breakpoint
RENAME TABLE `wigglypop_bids` TO `rotom_wigglypop_bids`;--> statement-breakpoint
RENAME TABLE `wigglypop_offers` TO `rotom_wigglypop_offers`;--> statement-breakpoint
RENAME TABLE `wigglypop_trade_offers` TO `rotom_wigglypop_trade_offers`;--> statement-breakpoint
RENAME TABLE `wigglypop_watchlist` TO `rotom_wigglypop_watchlist`;--> statement-breakpoint
RENAME TABLE `wigglypop_reviews` TO `rotom_wigglypop_reviews`;--> statement-breakpoint
-- Also flipped from a singular noun-phrase to `<plural head>`: one row is one item.
RENAME TABLE `wigglypop_item_catalog` TO `rotom_wigglypop_catalog_items`;--> statement-breakpoint

-- ─── StarBank: the table now names the product that owns it ──────────────────
RENAME TABLE `rotom_bank_accounts` TO `rotom_starbank_accounts`;--> statement-breakpoint
RENAME TABLE `rotom_bank_transactions` TO `rotom_starbank_transactions`;--> statement-breakpoint
-- `users_accounts` was the only plural-modifier junction in the schema.
RENAME TABLE `rotom_bank_users_accounts` TO `rotom_starbank_user_accounts`;--> statement-breakpoint

-- ─── Junction tables: `<owner>_<owned>`, singular modifier ───────────────────
RENAME TABLE `rotom_documents_users` TO `rotom_user_documents`;--> statement-breakpoint
RENAME TABLE `rotom_chat_users` TO `rotom_chat_members`;--> statement-breakpoint
-- Singular "detail" said nothing about what the rows are: they are rewards won.
RENAME TABLE `rotom_mine_games_detail` TO `rotom_mine_game_rewards`;--> statement-breakpoint

-- ─── Ficus owns discord_users; it was named as if it were platform-wide ──────
RENAME TABLE `discord_users` TO `ficus_discord_users`;--> statement-breakpoint

-- ─── Column names that disagreed with the property reading them ──────────────
-- `game` held a game id, next to an index already called `game_idx`.
ALTER TABLE `boffmedia_events` RENAME COLUMN `game` TO `game_id`;--> statement-breakpoint
-- `from`/`to` are reserved words AND unqualified names for account ids.
ALTER TABLE `rotom_starbank_transactions` RENAME COLUMN `from` TO `from_account_id`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` RENAME COLUMN `to` TO `to_account_id`;--> statement-breakpoint
-- The column said `concept`, every read of it said `reason`.
ALTER TABLE `rotom_starbank_transactions` RENAME COLUMN `concept` TO `reason`;
