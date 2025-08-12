import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional, Min, Max, IsUrl } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ 
    description: 'News title',
    example: 'Exciting New Features Released!'
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'News subtitle',
    example: 'Discover what\'s new in this update',
    required: false
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ 
    description: 'News category',
    example: 'Updates',
    required: false
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ 
    description: 'News subcategory',
    example: 'Game Features',
    required: false
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ 
    description: 'Published status (0=draft, 1=published)',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  published?: number;

  @ApiProperty({ 
    description: 'Featured status (0=normal, 1=featured)',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  featured?: number;

  @ApiProperty({ 
    description: 'News content',
    example: 'We are excited to announce the release of new features...'
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ 
    description: 'Button text for call-to-action',
    example: 'Learn More',
    required: false
  })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiProperty({ 
    description: 'Image URL for the news',
    example: 'https://example.com/news-image.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateNewsDto extends CreateNewsDto {}

export class NewsStatusDto {
  @ApiProperty({ 
    description: 'Array of news IDs to publish',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  published: number[];

  @ApiProperty({ 
    description: 'News ID to feature',
    example: 1
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  featured: number;
}

export class GetNewsDto {
  @ApiProperty({ 
    description: 'Filter by published status',
    example: 'true',
    required: false
  })
  @IsOptional()
  @IsString()
  published?: string;
}