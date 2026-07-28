-- Production-readiness pass (audit follow-up to 0035/0036).
-- 1) FK constraint names left stale by the 0035 table renames
-- 2) FKs and indexes the TS schema declares but the DB never got
-- 3) redundant indexes fully covered by a wider index
-- 4) rotom_chats.updated_at zero-dates

-- 1) rename stale FK constraints (drop + re-add, identical columns and rules)
ALTER TABLE `rotom_wigglypop_offers` DROP FOREIGN KEY `wigglypop_offers_listing_id_wigglypop_listings_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_offers` ADD CONSTRAINT `rotom_wigglypop_offers_listing_id_rotom_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` DROP FOREIGN KEY `rotom_bank_users_accounts_uuid_rotom_users_uuid_fk`;--> statement-breakpoint
ALTER TABLE `rotom_starbank_user_accounts` ADD CONSTRAINT `rotom_starbank_user_accounts_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_multas` DROP FOREIGN KEY `gobierno_multas_denuncia_id_gobierno_denuncias_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_multas` ADD CONSTRAINT `rotom_gobierno_multas_denuncia_id_rotom_gobierno_denuncias_id_fk` FOREIGN KEY (`denuncia_id`) REFERENCES `rotom_gobierno_denuncias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_bids` DROP FOREIGN KEY `wigglypop_bids_listing_id_wigglypop_listings_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_bids` ADD CONSTRAINT `rotom_wigglypop_bids_listing_id_rotom_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_parcelas` DROP FOREIGN KEY `gobierno_parcelas_zona_id_gobierno_zonas_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_parcelas` ADD CONSTRAINT `rotom_gobierno_parcelas_zona_id_rotom_gobierno_zonas_id_fk` FOREIGN KEY (`zona_id`) REFERENCES `rotom_gobierno_zonas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_reviews` DROP FOREIGN KEY `wigglypop_reviews_order_id_wigglypop_orders_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_reviews` ADD CONSTRAINT `rotom_wigglypop_reviews_order_id_rotom_wigglypop_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `rotom_wigglypop_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_pujas` DROP FOREIGN KEY `gobierno_pujas_subasta_id_gobierno_subastas_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_pujas` ADD CONSTRAINT `rotom_gobierno_pujas_subasta_id_rotom_gobierno_subastas_id_fk` FOREIGN KEY (`subasta_id`) REFERENCES `rotom_gobierno_subastas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `ficus_quotes` DROP FOREIGN KEY `ficus_quotes_discord_id_discord_users_user_id_fk`;--> statement-breakpoint
ALTER TABLE `ficus_quotes` ADD CONSTRAINT `ficus_quotes_discord_id_ficus_discord_users_user_id_fk` FOREIGN KEY (`discord_id`) REFERENCES `ficus_discord_users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_apelaciones` DROP FOREIGN KEY `gobierno_apelaciones_multa_id_gobierno_multas_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_apelaciones` ADD CONSTRAINT `rotom_gobierno_apelaciones_multa_id_rotom_gobierno_multas_id_fk` FOREIGN KEY (`multa_id`) REFERENCES `rotom_gobierno_multas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `boffmedia_events` DROP FOREIGN KEY `boffmedia_events_game_boffmedia_games_id_fk`;--> statement-breakpoint
ALTER TABLE `boffmedia_events` ADD CONSTRAINT `boffmedia_events_game_id_boffmedia_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `boffmedia_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_orders` DROP FOREIGN KEY `wigglypop_orders_buyer_uuid_rotom_users_uuid_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_orders` ADD CONSTRAINT `rotom_wigglypop_orders_buyer_uuid_rotom_users_uuid_fk` FOREIGN KEY (`buyer_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` DROP FOREIGN KEY `rotom_documents_users_document_id_rotom_documents_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` ADD CONSTRAINT `rotom_user_documents_document_id_rotom_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` DROP FOREIGN KEY `rotom_documents_users_uuid_rotom_users_uuid_fk`;--> statement-breakpoint
ALTER TABLE `rotom_user_documents` ADD CONSTRAINT `rotom_user_documents_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` DROP FOREIGN KEY `rotom_chat_users_chat_id_rotom_chats_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` ADD CONSTRAINT `rotom_chat_members_chat_id_rotom_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `rotom_chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` DROP FOREIGN KEY `rotom_chat_users_uuid_rotom_users_uuid_fk`;--> statement-breakpoint
ALTER TABLE `rotom_chat_members` ADD CONSTRAINT `rotom_chat_members_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_mine_game_rewards` DROP FOREIGN KEY `rotom_mine_games_detail_game_id_rotom_mine_games_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_mine_game_rewards` ADD CONSTRAINT `rotom_mine_game_rewards_game_id_rotom_mine_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `rotom_mine_games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_mine_game_rewards` DROP FOREIGN KEY `rotom_mine_games_detail_reward_id_rotom_mine_rewards_id_fk`;--> statement-breakpoint
ALTER TABLE `rotom_mine_game_rewards` ADD CONSTRAINT `rotom_mine_game_rewards_reward_id_rotom_mine_rewards_id_fk` FOREIGN KEY (`reward_id`) REFERENCES `rotom_mine_rewards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listings` DROP FOREIGN KEY `wigglypop_listings_seller_uuid_rotom_users_uuid_fk`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listings` ADD CONSTRAINT `rotom_wigglypop_listings_seller_uuid_rotom_users_uuid_fk` FOREIGN KEY (`seller_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint

-- 2a) FKs declared in the schema but absent from the DB
ALTER TABLE `boffmedia_notifications` ADD CONSTRAINT `boffmedia_notifications_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcg_sets` ADD CONSTRAINT `tcg_sets_series_id_tcg_series_id_fk` FOREIGN KEY (`series_id`) REFERENCES `tcg_series`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcg_cards` ADD CONSTRAINT `tcg_cards_set_id_tcg_sets_id_fk` FOREIGN KEY (`set_id`) REFERENCES `tcg_sets`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcg_user_cards` ADD CONSTRAINT `tcg_user_cards_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcg_user_cards` ADD CONSTRAINT `tcg_user_cards_card_id_tcg_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `tcg_cards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcg_user_card_history` ADD CONSTRAINT `tcg_user_card_history_user_id_boffmedia_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `boffmedia_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tcg_user_card_history` ADD CONSTRAINT `tcg_user_card_history_card_id_tcg_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `tcg_cards`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint

-- 2b) indexes declared in the schema but absent from the DB
CREATE INDEX `es_status_idx` ON `boffmedia_event_suggestions` (`status`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `boffmedia_notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notif_user_read_idx` ON `boffmedia_notifications` (`user_id`,`read_at`);--> statement-breakpoint

-- 2c) unique indexes still carrying their pre-0035 names
ALTER TABLE `rotom_gobierno_apelaciones` RENAME INDEX `gobierno_apelaciones_code_unique` TO `rotom_gobierno_apelaciones_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_buscados` RENAME INDEX `gobierno_buscados_code_unique` TO `rotom_gobierno_buscados_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_denuncias` RENAME INDEX `gobierno_denuncias_code_unique` TO `rotom_gobierno_denuncias_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_eventos` RENAME INDEX `gobierno_eventos_code_unique` TO `rotom_gobierno_eventos_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_expedientes` RENAME INDEX `gobierno_expedientes_code_unique` TO `rotom_gobierno_expedientes_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_multas` RENAME INDEX `gobierno_multas_code_unique` TO `rotom_gobierno_multas_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_npc_skins` RENAME INDEX `gobierno_npc_skins_skin_unique` TO `rotom_gobierno_npc_skins_skin_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_subastas` RENAME INDEX `gobierno_subastas_code_unique` TO `rotom_gobierno_subastas_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_gobierno_tasas` RENAME INDEX `gobierno_tasas_code_unique` TO `rotom_gobierno_tasas_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_listings` RENAME INDEX `wigglypop_listings_code_unique` TO `rotom_wigglypop_listings_code_unique`;--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_orders` RENAME INDEX `wigglypop_orders_code_unique` TO `rotom_wigglypop_orders_code_unique`;--> statement-breakpoint

-- 3) redundant indexes: each is a strict left-prefix of a wider index
DROP INDEX `pp_participant_idx` ON `boffmedia_participant_progress`;--> statement-breakpoint
DROP INDEX `tm_tournament_idx` ON `boffmedia_tournament_matches`;--> statement-breakpoint
DROP INDEX `tp_tournament_idx` ON `boffmedia_tournament_participants`;--> statement-breakpoint
DROP INDEX `tpe_phase_idx` ON `boffmedia_tournament_phase_entrants`;--> statement-breakpoint
DROP INDEX `rotom_pc_marks_user_idx` ON `rotom_pc_marks`;--> statement-breakpoint
DROP INDEX `vgc_limitless_teams_tournament_idx` ON `vgc_limitless_teams`;--> statement-breakpoint
DROP INDEX `vgc_limitless_tournaments_regulation_idx` ON `vgc_limitless_tournaments`;--> statement-breakpoint
DROP INDEX `vgc_pastes_repository_regulation_idx` ON `vgc_pastes_repository`;--> statement-breakpoint
DROP INDEX `vgc_smogon_snapshot_lookup_idx` ON `vgc_smogon_pokemon`;--> statement-breakpoint

-- 4) rotom_chats.updated_at was NOT NULL DEFAULT '0000-00-00 00:00:00'.
--    Zero-dates are not representable as a Date and break under NO_ZERO_DATE.
ALTER TABLE `rotom_chats` MODIFY COLUMN `updated_at` timestamp NULL DEFAULT NULL;--> statement-breakpoint
UPDATE `rotom_chats` SET `updated_at` = NULL WHERE `updated_at` = '0000-00-00 00:00:00';
