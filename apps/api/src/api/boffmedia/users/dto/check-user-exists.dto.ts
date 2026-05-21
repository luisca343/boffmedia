import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum UserIdentifierType {
  ID = 'id',
  USERNAME = 'username',
  EMAIL = 'email',
  UUID = 'uuid',
}

export class CheckUserExistsDto extends BaseDto {
  @ApiProperty({
    description: 'Identifier value',
    example: 'johndoe',
  })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'Type of identifier',
    example: UserIdentifierType.USERNAME,
    enum: UserIdentifierType,
  })
  @IsEnum(UserIdentifierType)
  type: UserIdentifierType;
}

export class CheckMultipleFieldsDto extends BaseDto {
  @ApiProperty({
    description: 'Username to check',
    required: false,
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'Email to check',
    required: false,
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'UUID to check',
    required: false,
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsOptional()
  @IsString()
  uuid?: string;
}
