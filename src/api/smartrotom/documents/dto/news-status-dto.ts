import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class NewsStatusDto {
  @ApiProperty({ description: 'List of published news IDs' })
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  published: number[];

  @ApiProperty({ description: 'Featured news ID' })
  @IsInt()
  @IsNotEmpty()
  featured: number;
}