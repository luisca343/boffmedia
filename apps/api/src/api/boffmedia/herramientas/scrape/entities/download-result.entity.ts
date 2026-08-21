import { ApiProperty } from '@nestjs/swagger';

export class DownloadResult {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: 'Life with Horses 3D + My Baby Pet Hotel 3D (Europe).zip',
  })
  filename: string;

  @ApiProperty({
    example:
      'laboon/juegos/myrient/3DS/Life with Horses 3D + My Baby Pet Hotel 3D (Europe).zip',
  })
  path: string;

  @ApiProperty({ example: 197502976, description: 'File size in bytes' })
  sizeBytes: number;

  @ApiProperty({
    example: '188.39 MiB',
    description: 'Human-readable file size',
  })
  size: string;
}
