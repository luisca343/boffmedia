import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Deliberately empty: the pending Microsoft device code is held server-side,
 *  keyed by the authenticated account, so the client has nothing to send. */
export class McLinkPollDto {}

export class McSessionDto {
  @ApiProperty({ description: 'Nombre de usuario de Minecraft' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username!: string;

  @ApiProperty({
    description: 'El serverId devuelto por /auth/minecraft/challenge',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  serverId!: string;
}
