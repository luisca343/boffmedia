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
};
