import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class LinkDiscordDto {
  @ApiProperty({
    example: '80351110224678912',
    description:
      'A Discord snowflake id, verified via Discord OAuth by the web.',
  })
  @IsString()
  @Matches(/^\d{5,32}$/, { message: 'discordId must be a numeric Discord id' })
  discordId: string;
}
