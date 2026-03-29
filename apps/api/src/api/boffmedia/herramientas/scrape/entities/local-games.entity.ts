import { ApiProperty } from '@nestjs/swagger';

export class LocalGameEntry {
  @ApiProperty({ example: 'Super Mario 3D Land (Europe).zip' })
  filename: string;

  @ApiProperty({ example: '1.19 GiB' })
  size: string;

  @ApiProperty({ example: 1277116416 })
  sizeBytes: number;
}

export class LocalGamesResult {
  @ApiProperty({ example: '3ds' })
  console: string;

  @ApiProperty({ example: 'Nintendo 3DS (Decrypted)' })
  consoleLabel: string;

  @ApiProperty({ example: 42 })
  count: number;

  @ApiProperty({ example: '49.85 GiB' })
  totalSize: string;

  @ApiProperty({ example: 53524684800 })
  totalSizeBytes: number;

  @ApiProperty({ type: [LocalGameEntry] })
  files: LocalGameEntry[];
}

export class SearchConsoleResult {
  @ApiProperty({ example: '3ds' })
  consoleKey: string;

  @ApiProperty({ example: 'Nintendo 3DS (Decrypted)' })
  consoleLabel: string;

  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ type: [LocalGameEntry] })
  files: LocalGameEntry[];
}

export class SearchLocalGamesResult {
  @ApiProperty({ example: 'Pokémon' })
  query: string;

  @ApiProperty({ example: 12 })
  totalCount: number;

  @ApiProperty({ type: [SearchConsoleResult] })
  consoles: SearchConsoleResult[];
}

// ─── Remote catalog search ────────────────────────────────────────────────────

import { GameFileEntry } from './game-file.entity';

export class CatalogSearchConsoleResult {
  @ApiProperty({ example: '3ds' })
  consoleKey: string;

  @ApiProperty({ example: 'Nintendo 3DS (Decrypted)' })
  consoleLabel: string;

  @ApiProperty({ example: 5 })
  count: number;

  @ApiProperty({ type: [GameFileEntry] })
  files: GameFileEntry[];
}

export class CatalogSearchResult {
  @ApiProperty({ example: 'Pokémon' })
  query: string;

  @ApiProperty({ example: 20 })
  totalCount: number;

  @ApiProperty({ type: [CatalogSearchConsoleResult] })
  consoles: CatalogSearchConsoleResult[];
}
