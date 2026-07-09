import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DownloadGameDto {
  @ApiProperty()
  @IsUrl()
  url: string;
}
