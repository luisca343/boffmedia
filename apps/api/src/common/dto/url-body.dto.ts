import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UrlBodyDto {
  @ApiProperty()
  @IsUrl()
  url: string;
}
