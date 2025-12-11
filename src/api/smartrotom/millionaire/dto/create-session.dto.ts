import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min, Max, IsOptional } from 'class-validator';

export class CreateSessionDto extends BaseDto {
  @ApiProperty({ 
    description: 'Conductor UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsUUID()
  conductorUuid: string;

  @ApiProperty({ 
    description: 'Question time limit in seconds',
    example: 30,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  questionTimeLimit?: number;
}
