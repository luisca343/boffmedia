CREATE TABLE `tcg_sets` (
	`id` varchar(32) NOT NULL,
	`series_id` varchar(32) NOT NULL,
	`name_en` varchar(128) NOT NULL,
	`name_es` varchar(128) NOT NULL,
	`logo` varchar(255),
	`symbol` varchar(255),
	`card_count_official` int,
	`card_count_total` int,
	CONSTRAINT `tcg_sets_id` PRIMARY KEY(`id`)
);
