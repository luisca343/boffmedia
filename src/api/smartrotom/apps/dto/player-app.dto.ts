import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, IsString, Min } from 'class-validator';

export class PlayerAppDto {
  @ApiProperty({ 
    description: 'The id of the app',
    example: 12
  })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ 
    description: 'The uuid of the player',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID()
  uuid: string;
}