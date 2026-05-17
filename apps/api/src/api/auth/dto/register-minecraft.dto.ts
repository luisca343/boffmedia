import { IsString, IsEmail, IsNotEmpty, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MinecraftAccountDto } from './minecraft-account.dto';

export class RegisterMinecraftDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @ValidateNested()
  @Type(() => MinecraftAccountDto)
  minecraft: MinecraftAccountDto;
}
