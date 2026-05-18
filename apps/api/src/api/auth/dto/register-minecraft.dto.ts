import { IsString, IsEmail, IsNotEmpty, IsDefined, MinLength, ValidateNested } from 'class-validator';
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

  @IsDefined()
  @ValidateNested()
  @Type(() => MinecraftAccountDto)
  minecraft: MinecraftAccountDto;
}
