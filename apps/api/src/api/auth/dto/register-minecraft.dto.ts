import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDefined,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MinecraftAccountDto } from './minecraft-account.dto';

export class RegisterMinecraftDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ type: MinecraftAccountDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => MinecraftAccountDto)
  minecraft: MinecraftAccountDto;
}
