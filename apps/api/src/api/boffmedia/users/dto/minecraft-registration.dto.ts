import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDefined,
  MinLength,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MinecraftDetailsDto {
  @ApiProperty({ example: 'Steve' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '069a79f4-44e9-4726-a5be-fca90e38aaf5' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 'world' })
  @IsString()
  @IsNotEmpty()
  world: string;
}

export class MinecraftRegistrationDto {
  @ApiProperty({ example: 'steve123' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'steve@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ type: MinecraftDetailsDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => MinecraftDetailsDto)
  minecraft: MinecraftDetailsDto;
}

export class MinecraftLinkDto extends MinecraftRegistrationDto {}
