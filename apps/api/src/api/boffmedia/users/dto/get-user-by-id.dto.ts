import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsUUID, IsNumberString } from 'class-validator';

export class GetUserByIdDto extends BaseDto {
  @ApiProperty({
    description: 'User ID',
    example: '1',
  })
  @IsNumberString()
  id: string;
}

export class GetUserByUsernameDto extends BaseDto {
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  @IsString()
  username: string;
}

export class GetUserByEmailDto extends BaseDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}

export class GetUserByUuidDto extends BaseDto {
  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;
}

export class GetUserByGoogleIdDto extends BaseDto {
  @ApiProperty({
    description: 'Google ID',
    example: 'google_123456789',
  })
  @IsString()
  googleId: string;
}
