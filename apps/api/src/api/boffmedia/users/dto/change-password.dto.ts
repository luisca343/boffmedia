import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The user\'s current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'The new password', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
