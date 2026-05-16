import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { MyrientConsole } from '../enums/myrient-console.enum';

export class DownloadAllGamesDto {
  @ApiProperty({
    description: 'Target console',
    enum: MyrientConsole,
    example: MyrientConsole.N3DS,
  })
  @IsEnum(MyrientConsole)
  console: MyrientConsole;

  @ApiProperty({
    description:
      'Region filters. A game is included when its filename contains ANY of these strings (case-insensitive). Leave empty to download everything.',
    type: [String],
    example: ['Europe'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

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
