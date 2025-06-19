import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { BaseDto } from '@api/_shared/dto/base.dto';

export class GetPlayerAppsDto extends BaseDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID()
  uuid: string;
}