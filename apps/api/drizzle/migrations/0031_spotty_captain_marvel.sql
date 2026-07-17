ALTER TABLE `rotom_inventory` ADD `reservation_id` varchar(36) NULL DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `rotom_inventory` ADD `reserved_at` timestamp NULL DEFAULT NULL;
