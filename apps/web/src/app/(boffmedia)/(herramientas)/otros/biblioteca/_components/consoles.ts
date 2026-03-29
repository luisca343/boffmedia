export type Manufacturer = 'Nintendo' | 'Sony' | 'Sega' | 'Microsoft' | 'Retro' | 'Arcade';

export interface ConsoleInfo {
  label: string;
  shortLabel: string;
  manufacturer: Manufacturer;
}

export const CONSOLES: Record<string, ConsoleInfo> = {
  // Nintendo
  nes:             { label: 'NES',                           shortLabel: 'NES',       manufacturer: 'Nintendo' },
  fds:             { label: 'Famicom Disk System',           shortLabel: 'FDS',       manufacturer: 'Nintendo' },
  snes:            { label: 'SNES',                          shortLabel: 'SNES',      manufacturer: 'Nintendo' },
  'virtual-boy':   { label: 'Virtual Boy',                   shortLabel: 'VB',        manufacturer: 'Nintendo' },
  'pokemon-mini':  { label: 'Pokémon Mini',                  shortLabel: 'PKMini',    manufacturer: 'Nintendo' },
  gb:              { label: 'Game Boy',                      shortLabel: 'GB',        manufacturer: 'Nintendo' },
  gbc:             { label: 'Game Boy Color',                shortLabel: 'GBC',       manufacturer: 'Nintendo' },
  gba:             { label: 'Game Boy Advance',              shortLabel: 'GBA',       manufacturer: 'Nintendo' },
  n64:             { label: 'Nintendo 64',                   shortLabel: 'N64',       manufacturer: 'Nintendo' },
  gamecube:        { label: 'GameCube',                      shortLabel: 'GCN',       manufacturer: 'Nintendo' },
  nds:             { label: 'Nintendo DS',                   shortLabel: 'NDS',       manufacturer: 'Nintendo' },
  '3ds':           { label: 'Nintendo 3DS',                  shortLabel: '3DS',       manufacturer: 'Nintendo' },
  wii:             { label: 'Wii',                           shortLabel: 'Wii',       manufacturer: 'Nintendo' },
  wiiu:            { label: 'Wii U',                         shortLabel: 'WiiU',      manufacturer: 'Nintendo' },
  // Sony
  psx:             { label: 'PlayStation',                   shortLabel: 'PS1',       manufacturer: 'Sony' },
  ps2:             { label: 'PlayStation 2',                 shortLabel: 'PS2',       manufacturer: 'Sony' },
  ps3:             { label: 'PlayStation 3',                 shortLabel: 'PS3',       manufacturer: 'Sony' },
  psp:             { label: 'PSP',                           shortLabel: 'PSP',       manufacturer: 'Sony' },
  'psvita-psn':    { label: 'PS Vita (PSN)',                 shortLabel: 'Vita',      manufacturer: 'Sony' },
  'psvita-updates':{ label: 'PS Vita (Updates)',             shortLabel: 'VitaU',     manufacturer: 'Sony' },
  // Microsoft
  xbox:            { label: 'Xbox',                          shortLabel: 'Xbox',      manufacturer: 'Microsoft' },
  'xbox-360':      { label: 'Xbox 360',                      shortLabel: 'X360',      manufacturer: 'Microsoft' },
  // Sega
  'sega-32x':      { label: '32X',                           shortLabel: '32X',       manufacturer: 'Sega' },
  'game-gear':     { label: 'Game Gear',                     shortLabel: 'GG',        manufacturer: 'Sega' },
  'master-system': { label: 'Master System',                 shortLabel: 'SMS',       manufacturer: 'Sega' },
  'mega-drive':    { label: 'Mega Drive / Genesis',          shortLabel: 'MD',        manufacturer: 'Sega' },
  dreamcast:       { label: 'Dreamcast (CHD)',               shortLabel: 'DC',        manufacturer: 'Sega' },
  saturn:          { label: 'Saturn (CHD, EU)',              shortLabel: 'SAT',       manufacturer: 'Sega' },
  'sega-cd':       { label: 'Mega CD (CHD, PAL)',            shortLabel: 'MCD',       manufacturer: 'Sega' },
  // Retro
  'pc-engine':         { label: 'PC Engine / TG-16',         shortLabel: 'PCE',       manufacturer: 'Retro' },
  'pc-engine-cd':      { label: 'PC Engine CD',              shortLabel: 'PCECD',     manufacturer: 'Retro' },
  'pc-engine-cd-chd':  { label: 'PC Engine CD (CHD)',        shortLabel: 'PCECHD',    manufacturer: 'Retro' },
  'pc-fx':             { label: 'PC-FX / PC-FXGA',           shortLabel: 'PCFX',      manufacturer: 'Retro' },
  pc98:                { label: 'NEC PC-98',                 shortLabel: 'PC98',      manufacturer: 'Retro' },
  'jaguar-cd':         { label: 'Jaguar CD',                 shortLabel: 'JAG',       manufacturer: 'Retro' },
  'jaguar-cd-chd':     { label: 'Jaguar CD (CHD)',           shortLabel: 'JAGCHD',    manufacturer: 'Retro' },
  pippin:              { label: 'Bandai Pippin',             shortLabel: 'PIP',       manufacturer: 'Retro' },
  'fm-towns':          { label: 'FM-Towns',                  shortLabel: 'FMT',       manufacturer: 'Retro' },
  '3do':               { label: 'Panasonic 3DO',             shortLabel: '3DO',       manufacturer: 'Retro' },
  '3do-chd':           { label: 'Panasonic 3DO (CHD)',       shortLabel: '3DOCHD',    manufacturer: 'Retro' },
  cdi:                 { label: 'Philips CD-i',              shortLabel: 'CDi',       manufacturer: 'Retro' },
  'neo-geo-cd':        { label: 'Neo Geo CD',                shortLabel: 'NGCD',      manufacturer: 'Retro' },
  'neo-geo-cd-chd':    { label: 'Neo Geo CD (CHD)',          shortLabel: 'NGCCHD',    manufacturer: 'Retro' },
  // Arcade
  'arcade-konami-firebeat':   { label: 'Konami FireBeat',              shortLabel: 'FireBeat',  manufacturer: 'Arcade' },
  'arcade-konami-sys573':     { label: 'Konami System 573',            shortLabel: 'Sys573',    manufacturer: 'Arcade' },
  'arcade-konami-sysgv':      { label: 'Konami System GV',             shortLabel: 'SysGV',     manufacturer: 'Arcade' },
  'arcade-konami-eamusement': { label: 'Konami e-Amusement',           shortLabel: 'eAMU',      manufacturer: 'Arcade' },
  'arcade-namco-triforce':    { label: 'Namco/Sega/Nintendo Triforce', shortLabel: 'Triforce',  manufacturer: 'Arcade' },
  'arcade-namco-sys246':      { label: 'Namco System 246',             shortLabel: 'Sys246',    manufacturer: 'Arcade' },
  'arcade-sega-chihiro':      { label: 'Sega Chihiro',                 shortLabel: 'Chihiro',   manufacturer: 'Arcade' },
  'arcade-sega-lindbergh':    { label: 'Sega Lindbergh',               shortLabel: 'Lindbergh', manufacturer: 'Arcade' },
  'arcade-sega-naomi':        { label: 'Sega Naomi',                   shortLabel: 'Naomi',     manufacturer: 'Arcade' },
  'arcade-sega-naomi2':       { label: 'Sega Naomi 2',                 shortLabel: 'Naomi2',    manufacturer: 'Arcade' },
  'arcade-sega-ringedge':     { label: 'Sega RingEdge',                shortLabel: 'RingEdge',  manufacturer: 'Arcade' },
  'arcade-sega-ringedge2':    { label: 'Sega RingEdge 2',              shortLabel: 'RingEdge2', manufacturer: 'Arcade' },
};

export const MANUFACTURER_COLORS: Record<Manufacturer, string> = {
  Nintendo:  'text-red-400',
  Sony:      'text-blue-400',
  Microsoft: 'text-green-400',
  Sega:      'text-orange-400',
  Retro:     'text-purple-400',
  Arcade:    'text-yellow-400',
};
