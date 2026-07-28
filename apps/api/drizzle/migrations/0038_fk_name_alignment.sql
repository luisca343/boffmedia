-- Align live FK constraint names with the schema after the over-long
-- auto-generated names were replaced by explicit short ones.

ALTER TABLE `boffmedia_event_suggestions` ADD CONSTRAINT `es_proposer_fk` FOREIGN KEY (`proposer_user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_apelaciones` DROP FOREIGN KEY `gobierno_apelaciones_refund_tx_id_rotom_bank_transactions_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_apelaciones` ADD CONSTRAINT `gob_apelaciones_refund_fk` FOREIGN KEY (`refund_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_bitacora` DROP FOREIGN KEY `gobierno_bitacora_patrulla_id_gobierno_patrullas_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_bitacora` ADD CONSTRAINT `gob_bitacora_patrulla_fk` FOREIGN KEY (`patrulla_id`) REFERENCES `rotom_gobierno_patrullas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_buscados` DROP FOREIGN KEY `gobierno_buscados_payout_tx_id_rotom_bank_transactions_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_buscados` ADD CONSTRAINT `gob_buscados_payout_fk` FOREIGN KEY (`payout_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_capturas` DROP FOREIGN KEY `gobierno_evento_capturas_evento_id_gobierno_eventos_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_capturas` ADD CONSTRAINT `gob_capturas_evento_fk` FOREIGN KEY (`evento_id`) REFERENCES `rotom_gobierno_eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_especies` DROP FOREIGN KEY `gobierno_evento_especies_evento_id_gobierno_eventos_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_especies` ADD CONSTRAINT `gob_especies_evento_fk` FOREIGN KEY (`evento_id`) REFERENCES `rotom_gobierno_eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_obras` DROP FOREIGN KEY `gobierno_evento_obras_evento_id_gobierno_eventos_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_evento_obras` ADD CONSTRAINT `gob_obras_evento_fk` FOREIGN KEY (`evento_id`) REFERENCES `rotom_gobierno_eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_multas` DROP FOREIGN KEY `gobierno_multas_paid_tx_id_rotom_bank_transactions_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_multas` ADD CONSTRAINT `gob_multas_paid_fk` FOREIGN KEY (`paid_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_patrulla_oficiales` DROP FOREIGN KEY `gobierno_patrulla_oficiales_patrulla_id_gobierno_patrullas_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_patrulla_oficiales` ADD CONSTRAINT `gob_patoff_patrulla_fk` FOREIGN KEY (`patrulla_id`) REFERENCES `rotom_gobierno_patrullas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_subastas` DROP FOREIGN KEY `gobierno_subastas_settled_tx_id_rotom_bank_transactions_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_subastas` ADD CONSTRAINT `gob_subastas_settled_fk` FOREIGN KEY (`settled_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` DROP FOREIGN KEY `rotom_bank_transactions_from_rotom_bank_accounts_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` ADD CONSTRAINT `sb_tx_from_fk` FOREIGN KEY (`from_account_id`) REFERENCES `rotom_starbank_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` DROP FOREIGN KEY `rotom_bank_transactions_to_rotom_bank_accounts_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_transactions` ADD CONSTRAINT `sb_tx_to_fk` FOREIGN KEY (`to_account_id`) REFERENCES `rotom_starbank_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` DROP FOREIGN KEY `rotom_bank_users_accounts_account_id_rotom_bank_accounts_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` ADD CONSTRAINT `sb_user_accounts_account_fk` FOREIGN KEY (`account_id`) REFERENCES `rotom_starbank_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listing_items` DROP FOREIGN KEY `wigglypop_listing_items_listing_id_wigglypop_listings_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listing_items` ADD CONSTRAINT `wp_litems_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listing_mons` DROP FOREIGN KEY `wigglypop_listing_mons_listing_id_wigglypop_listings_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listing_mons` ADD CONSTRAINT `wp_lmons_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_order_lines` DROP FOREIGN KEY `wigglypop_order_lines_order_id_wigglypop_orders_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_order_lines` ADD CONSTRAINT `wp_olines_order_fk` FOREIGN KEY (`order_id`) REFERENCES `rotom_wigglypop_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_order_lines` DROP FOREIGN KEY `wigglypop_order_lines_settle_tx_id_rotom_bank_transactions_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_order_lines` ADD CONSTRAINT `wp_olines_settle_fk` FOREIGN KEY (`settle_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_orders` DROP FOREIGN KEY `wigglypop_orders_escrow_tx_id_rotom_bank_transactions_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_orders` ADD CONSTRAINT `wp_orders_escrow_fk` FOREIGN KEY (`escrow_tx_id`) REFERENCES `rotom_starbank_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_trade_offers` DROP FOREIGN KEY `wigglypop_trade_offers_listing_id_wigglypop_listings_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_trade_offers` ADD CONSTRAINT `wp_trades_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_watchlist` DROP FOREIGN KEY `wigglypop_watchlist_listing_id_wigglypop_listings_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_watchlist` ADD CONSTRAINT `wp_watch_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
