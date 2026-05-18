import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Length } from 'class-validator';

export class UserLoginDto {
  @ApiProperty({ example: 'steve123' })
  @IsString()
  @Length(3, 32)
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
