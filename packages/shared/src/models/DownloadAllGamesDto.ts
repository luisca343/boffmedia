/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DownloadAllGamesDto = {
    /**
     * Target console
     */
    console: DownloadAllGamesDto.console;
    /**
     * Region filters. A game is included when its filename contains ANY of these strings (case-insensitive). Leave empty to download everything.
     */
    regions?: Array<string>;
    /**
     * Maximum number of concurrent downloads (1–5). Lower values are kinder to the server.
     */
    concurrency?: number;
};
export namespace DownloadAllGamesDto {
    /**
     * Target console
     */
    export enum console {
        NES = 'nes',
        FDS = 'fds',
        SNES = 'snes',
        VIRTUAL_BOY = 'virtual-boy',
        POKEMON_MINI = 'pokemon-mini',
        GB = 'gb',
        GBC = 'gbc',
        GBA = 'gba',
        GAMECUBE = 'gamecube',
        N64 = 'n64',
        NDS = 'nds',
        _3DS = '3ds',
        WII = 'wii',
        WIIU = 'wiiu',
        PSX = 'psx',
        PS2 = 'ps2',
        PS3 = 'ps3',
        PSP = 'psp',
        PSVITA_PSN = 'psvita-psn',
        PSVITA_UPDATES = 'psvita-updates',
        SEGA_32X = 'sega-32x',
        GAME_GEAR = 'game-gear',
        MASTER_SYSTEM = 'master-system',
        MEGA_DRIVE = 'mega-drive',
        DREAMCAST = 'dreamcast',
        SATURN = 'saturn',
        SEGA_CD = 'sega-cd',
        PC_ENGINE = 'pc-engine',
        PC_ENGINE_CD = 'pc-engine-cd',
        PC_ENGINE_CD_CHD = 'pc-engine-cd-chd',
        PC_FX = 'pc-fx',
        PC98 = 'pc98',
        JAGUAR_CD = 'jaguar-cd',
        JAGUAR_CD_CHD = 'jaguar-cd-chd',
        PIPPIN = 'pippin',
        FM_TOWNS = 'fm-towns',
        _3DO = '3do',
        _3DO_CHD = '3do-chd',
        CDI = 'cdi',
        NEO_GEO_CD = 'neo-geo-cd',
        NEO_GEO_CD_CHD = 'neo-geo-cd-chd',
        XBOX = 'xbox',
        XBOX_360 = 'xbox-360',
        ARCADE_KONAMI_FIREBEAT = 'arcade-konami-firebeat',
        ARCADE_KONAMI_SYS573 = 'arcade-konami-sys573',
        ARCADE_KONAMI_SYSGV = 'arcade-konami-sysgv',
        ARCADE_KONAMI_EAMUSEMENT = 'arcade-konami-eamusement',
        ARCADE_NAMCO_TRIFORCE = 'arcade-namco-triforce',
        ARCADE_NAMCO_SYS246 = 'arcade-namco-sys246',
        ARCADE_SEGA_CHIHIRO = 'arcade-sega-chihiro',
        ARCADE_SEGA_LINDBERGH = 'arcade-sega-lindbergh',
        ARCADE_SEGA_NAOMI = 'arcade-sega-naomi',
        ARCADE_SEGA_NAOMI2 = 'arcade-sega-naomi2',
        ARCADE_SEGA_RINGEDGE = 'arcade-sega-ringedge',
        ARCADE_SEGA_RINGEDGE2 = 'arcade-sega-ringedge2',
    }
}

