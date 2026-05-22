import { ApiProperty } from '@nestjs/swagger';

export class News {
  @ApiProperty({
    example: 1,
    description: 'News ID',
  })
  id: number;

  @ApiProperty({
    example: 'Exciting New Features Released!',
    description: 'News title',
  })
  title: string;

  @ApiProperty({
    example: "Discover what's new in this update",
    description: 'News subtitle',
  })
  subtitle: string;

  @ApiProperty({
    example: 'Updates',
    description: 'News category',
  })
  category: string;

  @ApiProperty({
    example: 'Game Features',
    description: 'News subcategory',
  })
  subcategory: string;

  @ApiProperty({
    example: 'Lúa Caminante',
    description: 'News author name',
  })
  author: string;

  @ApiProperty({
    example: '3 min',
    description: 'Estimated read time (calculated from content)',
  })
  readtime: string;

  @ApiProperty({
    example: 1,
    description: 'Published status (0=draft, 1=published)',
  })
  published: number;

  @ApiProperty({
    example: 0,
    description: 'Featured status (0=normal, 1=featured)',
  })
  featured: number;

  @ApiProperty({
    example: 'We are excited to announce the release of new features...',
    description: 'News content',
  })
  content: string;

  @ApiProperty({
    example: 'Learn More',
    description: 'Button text for call-to-action',
  })
  buttonText: string;

  @ApiProperty({
    example: 'https://example.com/news-image.jpg',
    description: 'Image URL for the news',
  })
  imageUrl: string;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'News creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'News last update date',
  })
  updatedAt: Date;
}

export class NewsResponse {
  @ApiProperty({
    description: 'Featured news item',
    type: News,
    nullable: true,
  })
  featured: News | null;

  @ApiProperty({
    description: 'List of news items',
    type: [News],
  })
  news: News[];
}

export class CreateNewsResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'News created successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    description: 'Created news details',
    type: News,
  })
  news: News;
}

export class NewsOperationResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;
}

export class SaveNewsResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 123,
    description: 'News ID',
  })
  id: number;
}
