import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateParticipantDto extends BaseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    description: 'Participant username',
    example: 'johndoe',
  })
  @IsString()
  username: string;
}
