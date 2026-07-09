import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The reset token from the emailed link' })
  @IsString()
  @MinLength(1)
  token: string;

  @ApiProperty({ description: 'The new password', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
