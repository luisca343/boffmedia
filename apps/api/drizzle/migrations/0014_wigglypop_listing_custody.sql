-- Custody locks for Wigglypop listings to prevent double-listing and concurrent modifications.
--
-- When a Pokémon is listed, it is locked by its pokemonKey to prevent:
-- 1. Double-listing the same mon (race condition)
-- 2. Concurrent modifications (moving/trading/releasing a listed mon)
--
-- The lock is released when the listing is cancelled or completed.
-- Unique constraint on (seller_uuid, pokemon_key) ensures only one listing
-- can lock a given mon pair at a time.

CREATE TABLE `rotom_wigglypop_mon_custody` (
	`seller_uuid` char(36) NOT NULL,
	`pokemon_key` varchar(64) NOT NULL,
	`listing_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wp_custody_seller_mon_uq` UNIQUE(`seller_uuid`,`pokemon_key`),
	INDEX `wp_custody_listing_idx` (`listing_id`),
	INDEX `wp_custody_seller_idx` (`seller_uuid`)
);
--> statement-breakpoint
ALTER TABLE `rotom_wigglypop_mon_custody` ADD CONSTRAINT `rotom_wigglypop_mon_custody_listing_id_rotom_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `rotom_wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;
