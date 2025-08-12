import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class SmartrotomRequestDto {
  @ApiHideProperty()
  uuid: string;

  @ApiHideProperty()
  server: string;
}

export class UuidDto extends BaseDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID()
  uuid: string;

}