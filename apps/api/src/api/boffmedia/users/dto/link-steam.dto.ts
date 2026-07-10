import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class LinkSteamDto {
  @ApiProperty({
    example: '76561197960287930',
    description: 'A 17-digit SteamID64, verified via Steam OpenID by the web.',
  })
  @IsString()
  @Matches(/^\d{17}$/, { message: 'steamId must be a 17-digit SteamID64' })
  steamId: string;
}
