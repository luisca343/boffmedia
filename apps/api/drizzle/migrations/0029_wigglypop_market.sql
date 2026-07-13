CREATE TABLE `wigglypop_bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`bidder_uuid` varchar(36) NOT NULL,
	`amount` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wigglypop_bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_item_catalog` (
	`id` varchar(128) NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(32) NOT NULL DEFAULT 'otros',
	`ref_price` bigint NOT NULL DEFAULT 0,
	`sprite` varchar(255),
	CONSTRAINT `wigglypop_item_catalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_listing_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`item_id` varchar(128) NOT NULL,
	`item_name` varchar(128) NOT NULL,
	`category` varchar(32),
	`qty` int NOT NULL DEFAULT 1,
	`unit_price` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `wigglypop_listing_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_listing_mons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`pokemon_key` varchar(64) NOT NULL,
	`source_box` int NOT NULL,
	`source_index` int NOT NULL,
	`dex` int NOT NULL,
	`species` varchar(64) NOT NULL,
	`form` varchar(64),
	`palette` varchar(64),
	`name` varchar(64),
	`level` int NOT NULL DEFAULT 1,
	`nature` varchar(32),
	`ability` varchar(64),
	`gender` varchar(16),
	`held_item` varchar(128),
	`ball` varchar(64),
	`ot` varchar(64),
	`caught_in` varchar(128),
	`ivs` json,
	`evs` json,
	`stats` json,
	`moves` json,
	`rarity` varchar(16) NOT NULL DEFAULT 'comun',
	`legendary` boolean NOT NULL DEFAULT false,
	`shiny` boolean NOT NULL DEFAULT false,
	`value` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `wigglypop_listing_mons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(24) NOT NULL,
	`seller_uuid` varchar(36) NOT NULL,
	`kind` varchar(16) NOT NULL,
	`format` varchar(16) NOT NULL DEFAULT 'fixed',
	`title` varchar(255) NOT NULL,
	`note` text,
	`status` varchar(16) NOT NULL DEFAULT 'activo',
	`price` bigint NOT NULL DEFAULT 0,
	`value` bigint NOT NULL DEFAULT 0,
	`escrow` boolean NOT NULL DEFAULT true,
	`views` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`sold_at` timestamp,
	`sold_for` bigint,
	`sold_order_id` int,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`current_bid` bigint NOT NULL DEFAULT 0,
	`bids` int NOT NULL DEFAULT 0,
	`min_increment` bigint NOT NULL DEFAULT 50,
	`buy_now` bigint,
	`wants` json,
	`trade_plus` boolean NOT NULL DEFAULT false,
	CONSTRAINT `wigglypop_listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `wigglypop_listings_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`buyer_uuid` varchar(36) NOT NULL,
	`amount` bigint NOT NULL,
	`qty` int NOT NULL DEFAULT 1,
	`status` varchar(16) NOT NULL DEFAULT 'pendiente',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`responded_at` timestamp,
	CONSTRAINT `wigglypop_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_order_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`listing_id` int NOT NULL,
	`seller_uuid` varchar(36) NOT NULL,
	`kind` varchar(16) NOT NULL,
	`qty` int NOT NULL DEFAULT 1,
	`unit_price` bigint NOT NULL DEFAULT 0,
	`line_total` bigint NOT NULL DEFAULT 0,
	`delivery_status` varchar(16) NOT NULL DEFAULT 'pendiente',
	`settle_tx_id` int,
	`taken_payload` json,
	`confirmed_at` timestamp,
	CONSTRAINT `wigglypop_order_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(24) NOT NULL,
	`buyer_uuid` varchar(36) NOT NULL,
	`subtotal` bigint NOT NULL DEFAULT 0,
	`fee` bigint NOT NULL DEFAULT 0,
	`total` bigint NOT NULL DEFAULT 0,
	`status` varchar(16) NOT NULL DEFAULT 'escrow',
	`escrow_tx_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wigglypop_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `wigglypop_orders_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`reviewer_uuid` varchar(36) NOT NULL,
	`seller_uuid` varchar(36) NOT NULL,
	`rating` tinyint NOT NULL,
	`body` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wigglypop_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `wp_reviews_order_reviewer_uq` UNIQUE(`order_id`,`reviewer_uuid`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_trade_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`proposer_uuid` varchar(36) NOT NULL,
	`offered_pokemon_key` varchar(64) NOT NULL,
	`offered_snapshot` json,
	`status` varchar(16) NOT NULL DEFAULT 'pendiente',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`responded_at` timestamp,
	CONSTRAINT `wigglypop_trade_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wigglypop_watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_uuid` varchar(36) NOT NULL,
	`listing_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wigglypop_watchlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `wp_watch_user_listing_uq` UNIQUE(`user_uuid`,`listing_id`)
);
--> statement-breakpoint
ALTER TABLE `wigglypop_bids` ADD CONSTRAINT `wigglypop_bids_listing_id_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_listing_items` ADD CONSTRAINT `wigglypop_listing_items_listing_id_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_listing_mons` ADD CONSTRAINT `wigglypop_listing_mons_listing_id_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_listings` ADD CONSTRAINT `wigglypop_listings_seller_uuid_rotom_users_uuid_fk` FOREIGN KEY (`seller_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_offers` ADD CONSTRAINT `wigglypop_offers_listing_id_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_order_lines` ADD CONSTRAINT `wigglypop_order_lines_order_id_wigglypop_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `wigglypop_orders`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_order_lines` ADD CONSTRAINT `wigglypop_order_lines_settle_tx_id_rotom_bank_transactions_id_fk` FOREIGN KEY (`settle_tx_id`) REFERENCES `rotom_bank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_orders` ADD CONSTRAINT `wigglypop_orders_buyer_uuid_rotom_users_uuid_fk` FOREIGN KEY (`buyer_uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_orders` ADD CONSTRAINT `wigglypop_orders_escrow_tx_id_rotom_bank_transactions_id_fk` FOREIGN KEY (`escrow_tx_id`) REFERENCES `rotom_bank_transactions`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_reviews` ADD CONSTRAINT `wigglypop_reviews_order_id_wigglypop_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `wigglypop_orders`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_trade_offers` ADD CONSTRAINT `wigglypop_trade_offers_listing_id_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `wigglypop_watchlist` ADD CONSTRAINT `wigglypop_watchlist_listing_id_wigglypop_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `wigglypop_listings`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `wp_bids_listing_idx` ON `wigglypop_bids` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_litems_listing_idx` ON `wigglypop_listing_items` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_lmons_listing_idx` ON `wigglypop_listing_mons` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_lmons_dex_idx` ON `wigglypop_listing_mons` (`dex`);--> statement-breakpoint
CREATE INDEX `wp_listings_browse_idx` ON `wigglypop_listings` (`status`,`kind`,`format`);--> statement-breakpoint
CREATE INDEX `wp_listings_seller_idx` ON `wigglypop_listings` (`seller_uuid`);--> statement-breakpoint
CREATE INDEX `wp_offers_listing_idx` ON `wigglypop_offers` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_offers_buyer_idx` ON `wigglypop_offers` (`buyer_uuid`);--> statement-breakpoint
CREATE INDEX `wp_olines_order_idx` ON `wigglypop_order_lines` (`order_id`);--> statement-breakpoint
CREATE INDEX `wp_olines_seller_idx` ON `wigglypop_order_lines` (`seller_uuid`);--> statement-breakpoint
CREATE INDEX `wp_olines_listing_idx` ON `wigglypop_order_lines` (`listing_id`);--> statement-breakpoint
CREATE INDEX `wp_orders_buyer_idx` ON `wigglypop_orders` (`buyer_uuid`);--> statement-breakpoint
CREATE INDEX `wp_reviews_seller_idx` ON `wigglypop_reviews` (`seller_uuid`);--> statement-breakpoint
CREATE INDEX `wp_trades_listing_idx` ON `wigglypop_trade_offers` (`listing_id`);--> statement-breakpoint
-- Seed the item reference price list from the Wigglypop handoff.
-- Idempotent: `ON DUPLICATE KEY UPDATE id = id` is a no-op for rows that already exist, so
-- re-running this never clobbers a ref_price an admin has since retuned.
-- NOTE: the `id` values are the Pixelmon item ids handed verbatim to wingull /giveitems.
-- They are transcribed from the standard Pixelmon registry and MUST be confirmed against the
-- server's actual item registry before anyone sells items for real money.
INSERT INTO `wigglypop_item_catalog` (`id`, `name`, `category`, `ref_price`) VALUES
	('pixelmon:master_ball', 'Master Ball', 'pokeballs', 9800),
	('pixelmon:rare_candy', 'Caramelo Raro', 'consumibles', 450),
	('pixelmon:ability_capsule', 'Cápsula Habilidad', 'mejoras', 3200),
	('pixelmon:silver_bottle_cap', 'Chapa Plateada', 'mejoras', 1800),
	('pixelmon:gold_bottle_cap', 'Chapa Dorada', 'mejoras', 6400),
	('pixelmon:life_orb', 'Vidasfera', 'objetos', 1200),
	('pixelmon:choice_specs', 'Gafas Elegidas', 'objetos', 1400),
	('pixelmon:leftovers', 'Restos', 'objetos', 1100),
	('pixelmon:focus_sash', 'Banda Focus', 'objetos', 950),
	('pixelmon:assault_vest', 'Chaleco Asalto', 'objetos', 1300),
	('pixelmon:eviolite', 'Mineral Evolutivo', 'objetos', 1500),
	('pixelmon:sitrus_berry', 'Baya Zidra', 'bayas', 220),
	('pixelmon:lum_berry', 'Baya Ziuela', 'bayas', 260),
	('pixelmon:choice_band', 'Cinta Elegida', 'objetos', 1400)
ON DUPLICATE KEY UPDATE `id` = `id`;
