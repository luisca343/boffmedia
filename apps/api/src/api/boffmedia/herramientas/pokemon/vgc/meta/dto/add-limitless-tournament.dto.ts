import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddLimitlessTournamentDto {
  @ApiProperty({
    example: 'https://play.limitlesstcg.com/tournament/euic-2026/standings',
    description: 'Limitless tournament standings URL',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
