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
