-- A19: Per-user daily token budget tracking for FicusAI.
-- One row per user per day, upserted on each request.
-- This design avoids selecting all rows, which would amplify rate-limit DoS.
CREATE TABLE `rotom_ficusai_usage` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `uuid` char(36) NOT NULL,
  `date` date NOT NULL,
  `input_tokens` int NOT NULL DEFAULT 0,
  `output_tokens` int NOT NULL DEFAULT 0,
  `total_tokens` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `ficusai_usage_user_date_idx` (`uuid`, `date`),
  FOREIGN KEY (`uuid`) REFERENCES `rotom_users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE
);
