import { BaseDto } from '@api/_shared/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, Min } from 'class-validator';

export class CreateUserReplayDto extends BaseDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Replay ID',
    example: 123
  })
  @IsInt()
  @Min(1)
  replayId: number;
}