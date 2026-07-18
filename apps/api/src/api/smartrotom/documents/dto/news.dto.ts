import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class CreateNewsDto extends BaseDto {
  @ApiProperty({
    description:
      'News ID. Ignored on create — the database assigns it, and the update ' +
      'route takes it from the URL. Optional so a client never has to invent one.',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    description: 'News title',
    example: 'Exciting New Features Released!',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'News subtitle',
    example: "Discover what's new in this update",
    required: false,
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({
    description: 'News category',
    example: 'Updates',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'News subcategory',
    example: 'Game Features',
    required: false,
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({
    description: 'Published status (0=draft, 1=published)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  published?: number;

  @ApiProperty({
    description: 'Featured status (0=normal, 1=featured)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  featured?: number;

  @ApiProperty({
    description: 'News content',
    example: 'We are excited to announce the release of new features...',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Button text for call-to-action',
    example: 'Learn More',
    required: false,
  })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiProperty({
    description: 'Image URL for the news',
    example: 'https://example.com/news-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Byline author name',
    example: 'Ada Furret',
    required: false,
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({
    description: 'Author masthead role',
    example: 'Editora de comunidad',
    required: false,
  })
  @IsOptional()
  @IsString()
  authorRole?: string;

  @ApiProperty({
    description: 'Magazine issue number',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  issue?: number;
}

export class UpdateNewsDto extends CreateNewsDto {}

export class NewsStatusDto extends BaseDto {
  @ApiProperty({
    description: 'Array of news IDs to publish',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  published: number[];

  @ApiProperty({
    description: 'News ID to feature',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  featured: number;
}

export class GetNewsDto extends BaseDto {
  @ApiProperty({
    description: 'Filter by published status',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  published?: string;
}

export class CreateNewsCommentDto extends BaseDto {
  @ApiProperty({
    description: 'Comment author UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({
    description: 'Comment body',
    example: 'Great update!',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  body: string;
}

export class NewsletterSubscribeDto extends BaseDto {
  @ApiProperty({
    description: 'Subscriber email address',
    example: 'reader@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
