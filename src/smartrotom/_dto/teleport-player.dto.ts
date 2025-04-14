import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TeleportPlayerDto {
  @ApiProperty({
    description: 'Name of the destination to teleport to',
    example: 'city_center'
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    description: 'UUID of the player to teleport',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}