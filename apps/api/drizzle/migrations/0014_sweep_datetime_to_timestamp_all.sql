ALTER TABLE `boffmedia_email_verifications` MODIFY COLUMN `expires_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_email_verifications` MODIFY COLUMN `used_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_email_verifications` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `boffmedia_password_reset_tokens` MODIFY COLUMN `expires_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `boffmedia_password_reset_tokens` MODIFY COLUMN `used_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_password_reset_tokens` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `discord_users` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `discord_users` MODIFY COLUMN `updated_at` timestamp;--> statement-breakpoint
ALTER TABLE `ficus_quotes` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `ficus_quotes` MODIFY COLUMN `updated_at` timestamp;--> statement-breakpoint
ALTER TABLE `ficus_messages` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `ficus_messages` MODIFY COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `ficus_messages` MODIFY COLUMN `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_notifications` MODIFY COLUMN `read_at` timestamp;--> statement-breakpoint
ALTER TABLE `boffmedia_notifications` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `rotom_inventory` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `rotom_notifications` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `rotom_mine_games` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `rotom_pokedex` MODIFY COLUMN `seen_at` timestamp DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `rotom_pokedex` MODIFY COLUMN `caught_at` timestamp;--> statement-breakpoint
ALTER TABLE `tcg_cards` MODIFY COLUMN `updated` timestamp;--> statement-breakpoint
ALTER TABLE `tcg_user_card_history` MODIFY COLUMN `date` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `tcg_user_cards` MODIFY COLUMN `acquired_date` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `tcg_user_cards` MODIFY COLUMN `created_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `tcg_user_cards` MODIFY COLUMN `updated_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_limitless_teams` MODIFY COLUMN `fetched_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_limitless_tournaments` MODIFY COLUMN `fetched_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_pastes_repository` MODIFY COLUMN `fetched_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_pokepastes` MODIFY COLUMN `fetched_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_regulations` MODIFY COLUMN `import_started_at` timestamp;--> statement-breakpoint
ALTER TABLE `vgc_regulations` MODIFY COLUMN `import_completed_at` timestamp;--> statement-breakpoint
ALTER TABLE `vgc_regulations` MODIFY COLUMN `created_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_smogon_pokemon` MODIFY COLUMN `fetched_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_smogon_snapshots` MODIFY COLUMN `fetched_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `vgc_matches` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `vgc_matches` MODIFY COLUMN `completed_at` timestamp;--> statement-breakpoint
ALTER TABLE `vgc_matches` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `vgc_series` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `vgc_sessions` MODIFY COLUMN `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `vgc_sessions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `vgc_sessions` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `vgc_team_presets` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `vgc_team_presets` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `wingull_invites` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP();--> statement-breakpoint
ALTER TABLE `wingull_invites` MODIFY COLUMN `used_at` timestamp;--> statement-breakpoint
ALTER TABLE `wingull_invites` MODIFY COLUMN `deleted_at` timestamp;