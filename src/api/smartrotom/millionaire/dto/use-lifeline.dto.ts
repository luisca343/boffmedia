import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, IsEnum } from 'class-validator';

export enum LifelineType {
  FIFTY_FIFTY = '50:50',
  PHONE_A_FRIEND = 'phone',
  ASK_THE_AUDIENCE = 'audience'
}

export class UseLifelineDto extends BaseDto {
  @ApiProperty({ 
    description: 'Event ID',
    example: 1
  })
  @IsInt()
  eventId: number;

  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsUUID()
  playerUuid: string;

  @ApiProperty({ 
    description: 'Lifeline type',
    enum: LifelineType,
    example: LifelineType.FIFTY_FIFTY
  })
  @IsEnum(LifelineType)
  lifelineType: LifelineType;
}
