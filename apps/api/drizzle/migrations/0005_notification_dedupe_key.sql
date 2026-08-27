ALTER TABLE `boffmedia_notifications` ADD `dedupe_key` varchar(120);--> statement-breakpoint
ALTER TABLE `boffmedia_notifications` ADD CONSTRAINT `notif_dedupe_uq` UNIQUE(`dedupe_key`);