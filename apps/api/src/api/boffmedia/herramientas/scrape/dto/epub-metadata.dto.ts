import { IsString, IsOptional, IsArray } from 'class-validator';

export class EpubMetadataDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() language?: string;
  @IsString() @IsOptional() author?: string;
  @IsString() @IsOptional() authorSort?: string;
  @IsString() @IsOptional() illustrator?: string;
  @IsString() @IsOptional() illustratorSort?: string;
  @IsString() @IsOptional() publisher?: string;
  @IsString() @IsOptional() date?: string;
  @IsArray() @IsOptional() subjects?: string[];
}
