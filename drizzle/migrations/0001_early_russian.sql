CREATE TABLE `pokedex` (
	`uuid` char(36) NOT NULL,
	`pokemon_id` int NOT NULL,
	`form_id` int NOT NULL,
	`palette_id` int NOT NULL,
	`registered_at` datetime DEFAULT CURRENT_TIMESTAMP(),
	`caught_at` datetime
);
