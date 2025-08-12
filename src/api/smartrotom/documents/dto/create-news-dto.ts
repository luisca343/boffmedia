import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ description: 'Title of the news', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Subtitle of the news', maxLength: 255, required: false })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: 'Category of the news', maxLength: 255, required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Subcategory of the news', maxLength: 255, required: false })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ description: 'Published status of the news', default: 0 })
  @IsInt()
  @IsNotEmpty()
  published: number;

  @ApiProperty({ description: 'Featured status of the news', default: 0 })
  @IsInt()
  @IsNotEmpty()
  featured: number;

  @ApiProperty({ description: 'Content of the news' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Button text for the news', maxLength: 255, required: false })
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiProperty({ description: 'Image URL for the news', maxLength: 255, required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Creation timestamp of the news' })
  @IsString()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({ description: 'Update timestamp of the news' })
  @IsString()
  @IsNotEmpty()
  updatedAt: string;
}