import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSharexTokenDto {
  @ApiProperty({
    description: 'Who holds this token, shown in the admin list.',
    example: 'Luisca desktop',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  label: string;
}
