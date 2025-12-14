import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateSessionDto extends BaseDto {
  @ApiProperty({ 
    description: 'Conductor UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsUUID()
  conductorUuid: string;
}
