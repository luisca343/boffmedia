import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class JoinEventDto extends BaseDto {
  @ApiProperty({ 
    description: 'Event code',
    example: 'ABCD1234'
  })
  @IsString()
  @Length(8, 8)
  eventCode: string;

  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsUUID()
  playerUuid: string;
}

// Maintain backwards compatibility alias
export class JoinSessionDto extends JoinEventDto {}
