import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * Whose dock a `player/*` route acts on. Omit it and the owner comes from the
 * session, which is what every player client does; only an admin may name
 * someone else, and `adminTargetUuid` enforces that server-side.
 */
export class PlayerScopeDto extends BaseDto {
  @ApiPropertyOptional({
    description:
      "Target player's Minecraft uuid. Admin-only; defaults to the caller.",
    example: 'd8f3a1c0-1f2e-4b7a-9c3d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsUUID()
  uuid?: string;
}

export class PlayerAppDto extends PlayerScopeDto {
  @ApiProperty({
    description: 'The id of the app',
    example: 12,
  })
  @IsInt()
  @Min(1)
  id: number;
}
