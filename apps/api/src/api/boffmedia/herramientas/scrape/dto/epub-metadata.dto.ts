import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EpubMetadataDto {
  @ApiPropertyOptional() @IsString() @IsOptional() title?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() language?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() author?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() authorSort?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() illustrator?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() illustratorSort?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() publisher?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() date?: string;
  @ApiPropertyOptional({ type: [String] }) @IsArray() @IsOptional() subjects?: string[];
}
