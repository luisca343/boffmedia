import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ example: 'steve@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Steve Player' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @ApiPropertyOptional({ example: 'https://lh3.googleusercontent.com/...' })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
