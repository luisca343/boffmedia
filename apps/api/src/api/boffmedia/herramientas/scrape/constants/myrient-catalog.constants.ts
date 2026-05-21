import { MyrientConsole } from '../enums/myrient-console.enum';

export const MYRIENT_BASE_URL = 'https://myrient.erista.me';

export interface ConsoleCatalogEntry {
  /** Full URL to the Myrient h5ai directory listing */
  url: string;
  /** Sub-folder name used when saving files locally under public/juegos/myrient/ */
  localFolder: string;
  /** Human-readable label */
  label: string;
}

export const CONSOLE_CATALOG: Record<MyrientConsole, ConsoleCatalogEntry> = {
  [MyrientConsole.NES]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Nintendo%20Entertainment%20System%20(Headered)/`,
    localFolder: 'Nintendo NES',
    label: 'Nintendo Entertainment System (NES)',
  },
  [MyrientConsole.FDS]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Family%20Computer%20Disk%20System%20(FDS)/`,
    localFolder: 'Nintendo FDS',
    label: 'Nintendo Family Computer Disk System (FDS)',
  },
  [MyrientConsole.SNES]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Super%20Nintendo%20Entertainment%20System/`,
    localFolder: 'Nintendo SNES',
    label: 'Super Nintendo Entertainment System (SNES)',
  },
  [MyrientConsole.VIRTUAL_BOY]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Virtual%20Boy/`,
    localFolder: 'Nintendo Virtual Boy',
    label: 'Nintendo Virtual Boy',
  },
  [MyrientConsole.POKEMON_MINI]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Pokemon%20Mini/`,
    localFolder: 'Nintendo Pokemon Mini',
    label: 'Nintendo Pokémon Mini',
  },
  [MyrientConsole.GB]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Game%20Boy/`,
    localFolder: 'Game Boy',
    label: 'Nintendo Game Boy',
  },
  [MyrientConsole.GBC]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Game%20Boy%20Color/`,
    localFolder: 'Game Boy Color',
    label: 'Nintendo Game Boy Color',
  },
  [MyrientConsole.GBA]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Game%20Boy%20Advance/`,
    localFolder: 'Game Boy Advance',
    label: 'Nintendo Game Boy Advance',
  },
  [MyrientConsole.GAMECUBE]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Nintendo%20-%20GameCube%20-%20NKit%20RVZ%20[zstd-19-128k]/`,
    localFolder: 'Nintendo GameCube',
    label: 'Nintendo GameCube (NKit RVZ)',
  },
  [MyrientConsole.N64]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Nintendo%2064%20%28BigEndian%29/`,
    localFolder: 'Nintendo 64',
    label: 'Nintendo 64 (BigEndian)',
  },
  [MyrientConsole.NDS]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Nintendo%20DS%20%28Decrypted%29/`,
    localFolder: 'Nintendo DS',
    label: 'Nintendo DS (Decrypted)',
  },
  [MyrientConsole.N3DS]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Nintendo%203DS%20%28Decrypted%29/`,
    localFolder: 'Nintendo 3DS',
    label: 'Nintendo 3DS (Decrypted)',
  },
  [MyrientConsole.WII]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Nintendo%20-%20Wii%20-%20NKit%20RVZ%20[zstd-19-128k]/`,
    localFolder: 'Nintendo Wii',
    label: 'Nintendo Wii (NKit RVZ)',
  },
  [MyrientConsole.WIIU]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Nintendo%20-%20Wii%20U%20(Digital)%20(CDN)/`,
    localFolder: 'Nintendo Wii U',
    label: 'Nintendo Wii U (Digital CDN)',
  },
  [MyrientConsole.PSX]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Sony%20-%20PlayStation/`,
    localFolder: 'PlayStation',
    label: 'Sony PlayStation',
  },
  [MyrientConsole.PS2]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Sony%20-%20PlayStation%202/`,
    localFolder: 'PlayStation 2',
    label: 'Sony PlayStation 2',
  },
  [MyrientConsole.PS3]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Sony%20-%20PlayStation%203/`,
    localFolder: 'PlayStation 3',
    label: 'Sony PlayStation 3',
  },
  [MyrientConsole.PSP]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Sony%20-%20PlayStation%20Portable/`,
    localFolder: 'PlayStation Portable',
    label: 'Sony PlayStation Portable',
  },
  [MyrientConsole.PSVITA_PSN]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Sony%20-%20PlayStation%20Vita%20(PSN)%20(Content)/`,
    localFolder: 'PlayStation Vita PSN Content',
    label: 'Sony PlayStation Vita (PSN Content)',
  },
  [MyrientConsole.PSVITA_UPD]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Sony%20-%20PlayStation%20Vita%20(PSN)%20(Updates)/`,
    localFolder: 'PlayStation Vita PSN Updates',
    label: 'Sony PlayStation Vita (PSN Updates)',
  },

  // ── Sega ────────────────────────────────────────────────────────────────
  [MyrientConsole.SEGA_32X]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Sega%20-%2032X/`,
    localFolder: 'Sega 32X',
    label: 'Sega 32X',
  },
  [MyrientConsole.GAME_GEAR]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Sega%20-%20Game%20Gear/`,
    localFolder: 'Sega Game Gear',
    label: 'Sega Game Gear',
  },
  [MyrientConsole.MASTER_SYSTEM]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Sega%20-%20Master%20System%20-%20Mark%20III/`,
    localFolder: 'Sega Master System',
    label: 'Sega Master System / Mark III',
  },
  [MyrientConsole.MEGA_DRIVE]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/Sega%20-%20Mega%20Drive%20-%20Genesis/`,
    localFolder: 'Sega Mega Drive',
    label: 'Sega Mega Drive / Genesis',
  },
  [MyrientConsole.DREAMCAST]: {
    url: `${MYRIENT_BASE_URL}/files/Internet%20Archive/chadmaster/dc-chd-zstd-redump/dc-chd-zstd/`,
    localFolder: 'Sega Dreamcast',
    label: 'Sega Dreamcast (CHD)',
  },
  [MyrientConsole.SATURN]: {
    url: `${MYRIENT_BASE_URL}/files/Internet%20Archive/chadmaster/chd_saturn/CHD-Saturn/Europe/`,
    localFolder: 'Sega Saturn',
    label: 'Sega Saturn (CHD, Europe)',
  },
  [MyrientConsole.SEGA_CD]: {
    url: `${MYRIENT_BASE_URL}/files/Internet%20Archive/chadmaster/chd_segacd/CHD-MegaCD-PAL/`,
    localFolder: 'Sega CD',
    label: 'Sega CD / Mega CD (CHD, PAL)',
  },

  // ── Retro ────────────────────────────────────────────────────────────────
  [MyrientConsole.PC_ENGINE]: {
    url: `${MYRIENT_BASE_URL}/files/No-Intro/NEC%20-%20PC%20Engine%20-%20TurboGrafx-16/`,
    localFolder: 'PC Engine TurboGrafx-16',
    label: 'NEC PC Engine / TurboGrafx-16',
  },
  [MyrientConsole.PC_ENGINE_CD]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/NEC%20-%20PC%20Engine%20CD%20&%20TurboGrafx%20CD/`,
    localFolder: 'PC Engine CD',
    label: 'NEC PC Engine CD / TurboGrafx CD',
  },
  [MyrientConsole.PC_ENGINE_CD_CHD]: {
    url: `${MYRIENT_BASE_URL}/files/Internet%20Archive/chadmaster/pcecd-chd-zstd-redump/pcecd-chd-zstd/`,
    localFolder: 'PC Engine CD CHD',
    label: 'NEC PC Engine CD / TurboGrafx CD (CHD)',
  },
  [MyrientConsole.PC_FX]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/NEC%20-%20PC-FX%20&%20PC-FXGA/`,
    localFolder: 'NEC PC-FX',
    label: 'NEC PC-FX / PC-FXGA',
  },
  [MyrientConsole.PC98]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/NEC%20-%20PC-98%20series/`,
    localFolder: 'NEC PC-98',
    label: 'NEC PC-98',
  },
  [MyrientConsole.JAGUAR_CD]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Atari%20-%20Jaguar%20CD%20Interactive%20Multimedia%20System/`,
    localFolder: 'Atari Jaguar CD',
    label: 'Atari Jaguar CD',
  },
  [MyrientConsole.JAGUAR_CD_CHD]: {
    url: `${MYRIENT_BASE_URL}/files/Internet%20Archive/chadmaster/jagcd-chd-zstd/jagcd-chd-zstd/`,
    localFolder: 'Atari Jaguar CD CHD',
    label: 'Atari Jaguar CD (CHD)',
  },
  [MyrientConsole.PIPPIN]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Bandai%20-%20Pippin/`,
    localFolder: 'Bandai Pippin',
    label: 'Bandai Pippin',
  },
  [MyrientConsole.FM_TOWNS]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Fujitsu%20-%20FM-Towns/`,
    localFolder: 'Fujitsu FM-Towns',
    label: 'Fujitsu FM-Towns',
  },
  [MyrientConsole._3DO]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Panasonic%20-%203DO%20Interactive%20Multiplayer/`,
    localFolder: 'Panasonic 3DO',
    label: 'Panasonic 3DO Interactive Multiplayer',
  },
  [MyrientConsole._3DO_CHD]: {
    url: `${MYRIENT_BASE_URL}/files/Internet%20Archive/chadmaster/3do-chd-zstd-redump/3do-chd-zstd/`,
    localFolder: 'Panasonic 3DO CHD',
    label: 'Panasonic 3DO (CHD)',
  },
  [MyrientConsole.CDI]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Philips%20-%20CD-i/`,
    localFolder: 'Philips CD-i',
    label: 'Philips CD-i',
  },
  [MyrientConsole.NEO_GEO_CD]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/SNK%20-%20Neo%20Geo%20CD/`,
    localFolder: 'SNK Neo Geo CD',
    label: 'SNK Neo Geo CD',
  },
  [MyrientConsole.NEO_GEO_CD_CHD]: {
    url: `${MYRIENT_BASE_URL}/files/Internet%20Archive/chadmaster/ngcd-chd-zstd-redump/ngcd-chd-zstd/`,
    localFolder: 'SNK Neo Geo CD CHD',
    label: 'SNK Neo Geo CD (CHD)',
  },

  // ── Microsoft ────────────────────────────────────────────────────────────
  [MyrientConsole.XBOX]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Microsoft%20-%20Xbox/`,
    localFolder: 'Microsoft Xbox',
    label: 'Microsoft Xbox',
  },
  [MyrientConsole.XBOX_360]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Microsoft%20-%20Xbox%20360/`,
    localFolder: 'Microsoft Xbox 360',
    label: 'Microsoft Xbox 360',
  },

  // ── Arcade ───────────────────────────────────────────────────────────────
  [MyrientConsole.ARCADE_KONAMI_FIREBEAT]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Konami%20-%20FireBeat/`,
    localFolder: 'Arcade Konami FireBeat',
    label: 'Arcade - Konami FireBeat',
  },
  [MyrientConsole.ARCADE_KONAMI_SYS573]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Konami%20-%20System%20573/`,
    localFolder: 'Arcade Konami System 573',
    label: 'Arcade - Konami System 573',
  },
  [MyrientConsole.ARCADE_KONAMI_SYSGV]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Konami%20-%20System%20GV/`,
    localFolder: 'Arcade Konami System GV',
    label: 'Arcade - Konami System GV',
  },
  [MyrientConsole.ARCADE_KONAMI_EAMUSEMENT]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Konami%20-%20e-Amusement/`,
    localFolder: 'Arcade Konami e-Amusement',
    label: 'Arcade - Konami e-Amusement',
  },
  [MyrientConsole.ARCADE_NAMCO_TRIFORCE]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Namco%20-%20Sega%20-%20Nintendo%20-%20Triforce/`,
    localFolder: 'Arcade Namco Triforce',
    label: 'Arcade - Namco / Sega / Nintendo Triforce',
  },
  [MyrientConsole.ARCADE_NAMCO_SYS246]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Namco%20-%20System%20246/`,
    localFolder: 'Arcade Namco System 246',
    label: 'Arcade - Namco System 246',
  },
  [MyrientConsole.ARCADE_SEGA_CHIHIRO]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Sega%20-%20Chihiro/`,
    localFolder: 'Arcade Sega Chihiro',
    label: 'Arcade - Sega Chihiro',
  },
  [MyrientConsole.ARCADE_SEGA_LINDBERGH]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Sega%20-%20Lindbergh/`,
    localFolder: 'Arcade Sega Lindbergh',
    label: 'Arcade - Sega Lindbergh',
  },
  [MyrientConsole.ARCADE_SEGA_NAOMI]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Sega%20-%20Naomi/`,
    localFolder: 'Arcade Sega Naomi',
    label: 'Arcade - Sega Naomi',
  },
  [MyrientConsole.ARCADE_SEGA_NAOMI2]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Sega%20-%20Naomi%202/`,
    localFolder: 'Arcade Sega Naomi 2',
    label: 'Arcade - Sega Naomi 2',
  },
  [MyrientConsole.ARCADE_SEGA_RINGEDGE]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Sega%20-%20RingEdge/`,
    localFolder: 'Arcade Sega RingEdge',
    label: 'Arcade - Sega RingEdge',
  },
  [MyrientConsole.ARCADE_SEGA_RINGEDGE2]: {
    url: `${MYRIENT_BASE_URL}/files/Redump/Arcade%20-%20Sega%20-%20RingEdge%202/`,
    localFolder: 'Arcade Sega RingEdge 2',
    label: 'Arcade - Sega RingEdge 2',
  },
};
