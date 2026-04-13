import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class DownloadMangaNovelDto {
  @ApiProperty({
    description: 'Novel page URL',
    example: 'https://es.novelcool.com/novel/La-Raz-n-Por-La-Que-Raeliana-Termin-En-La-Mansi-n-Del-Duque.html',
  })
  @IsUrl({}, { message: 'url must be a valid URL' })
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'First chapter to download (1-based, inclusive)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  from?: number;

  @ApiProperty({
    description: 'Last chapter to download (1-based, inclusive)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  to?: number;
}
