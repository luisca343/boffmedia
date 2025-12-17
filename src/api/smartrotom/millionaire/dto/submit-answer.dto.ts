import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min, Max } from 'class-validator';

export class SubmitAnswerDto extends BaseDto {
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
    description: 'Answer index (0-3)',
    example: 2
  })
  @IsInt()
  @Min(0)
  @Max(3)
  answerIndex: number;
}
