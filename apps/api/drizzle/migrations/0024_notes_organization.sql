CREATE TABLE `rotom_note_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(32) NOT NULL DEFAULT 'primary',
	`parent_id` int,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `rotom_note_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_note_tag_links` (
	`document_id` int NOT NULL,
	`tag_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotom_note_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`label` varchar(64) NOT NULL,
	`color` varchar(32) NOT NULL DEFAULT 'primary',
	`created_at` timestamp NOT NULL,
	CONSTRAINT `rotom_note_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotom_note_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_id` int NOT NULL,
	`label` varchar(255),
	`content` text NOT NULL,
	`author_uuid` varchar(36),
	`words` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `rotom_note_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rotom_documents` ADD `public` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_documents` ADD `pinned` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rotom_documents` ADD `folder_id` int;--> statement-breakpoint
ALTER TABLE `rotom_documents` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `rotom_note_folders` ADD CONSTRAINT `rotom_note_folders_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_folders` ADD CONSTRAINT `rotom_note_folders_parent_id_rotom_note_folders_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `rotom_note_folders`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` ADD CONSTRAINT `rotom_note_tag_links_document_id_rotom_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_tag_links` ADD CONSTRAINT `rotom_note_tag_links_tag_id_rotom_note_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `rotom_note_tags`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_tags` ADD CONSTRAINT `rotom_note_tags_uuid_rotom_users_uuid_fk` FOREIGN KEY (`uuid`) REFERENCES `rotom_users`(`uuid`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_note_versions` ADD CONSTRAINT `rotom_note_versions_document_id_rotom_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `rotom_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rotom_documents` ADD CONSTRAINT `rotom_documents_folder_id_rotom_note_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `rotom_note_folders`(`id`) ON DELETE set null ON UPDATE cascade;