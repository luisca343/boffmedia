-- Repoint TCG Pocket card artwork at the prefix that actually serves it.
--
-- The downloader writes to publicPath('boffmedia','tools','tcg',...) but kept
-- returning the pre-reorg '/img/games/tcg/...' URL, so every stored path pointed
-- at nothing and no card art rendered. The files themselves never changed name --
-- only the prefix -- so this is a string swap, not a re-download.
--
-- Idempotent: the WHERE matches nothing once it has run.
UPDATE `tools_tcg_cards` SET `image_local_en` = REPLACE(`image_local_en`, '/img/games/tcg/', '/boffmedia/tools/tcg/') WHERE `image_local_en` LIKE '/img/games/tcg/%';
--> statement-breakpoint
UPDATE `tools_tcg_cards` SET `image_local_es` = REPLACE(`image_local_es`, '/img/games/tcg/', '/boffmedia/tools/tcg/') WHERE `image_local_es` LIKE '/img/games/tcg/%';
