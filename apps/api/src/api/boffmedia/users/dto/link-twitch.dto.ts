import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class LinkTwitchDto {
  @ApiProperty({
    example: '141981764',
    description: "Twitch user id, verified via Twitch OAuth by the web.",
  })
  @IsString()
  @Matches(/^\d{1,20}$/, { message: 'twitchId must be a numeric Twitch id' })
  twitchId: string;
}
