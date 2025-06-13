import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, IsString, Min } from 'class-validator';

export class PlayerAppDto {
  @ApiProperty({ 
    description: 'The id of the app',
    example: 1
  })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ 
    description: 'The uuid of the player',
    example: '007d1a64-661c-4396-8844-e27856f2ddfa'
  })
  @IsString()
  @IsUUID()
  uuid: string;
}