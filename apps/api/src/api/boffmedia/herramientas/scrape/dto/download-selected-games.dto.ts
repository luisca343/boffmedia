import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { GameFileEntry } from '../entities/game-file.entity';
import { MyrientConsole } from '../enums/myrient-console.enum';

export class DownloadSelectedGamesDto {
  @ApiProperty({
    description: 'Target console — determines the local save folder',
    enum: MyrientConsole,
    example: MyrientConsole.N3DS,
  })
  @IsEnum(MyrientConsole)
  console: MyrientConsole;

  @ApiProperty({
    description:
      'Array of game entries to download. Each entry must include the name, direct download link, and reported file size.',
    type: [GameFileEntry],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameFileEntry)
  games: GameFileEntry[];

  @ApiProperty({
    description:
      'Maximum number of concurrent downloads (1–5). Lower values are kinder to the server.',
    example: 2,
    required: false,
    default: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  concurrency?: number;
}
