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
    example: true,
    description: 'Published, as opposed to a draft',
  })
  published: boolean;

  @ApiProperty({
    example: false,
    description: 'Featured on the news landing page',
  })
  featured: boolean;

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

  @ApiProperty({
    example: 'Ada Furret',
    description: 'Byline author name',
    nullable: true,
    type: String,
  })
  author: string | null;

  @ApiProperty({
    example: 'Editora de comunidad',
    description: 'Author masthead role',
    nullable: true,
    type: String,
  })
  authorRole: string | null;

  @ApiProperty({
    example: 12,
    description: 'Magazine issue number',
    nullable: true,
    type: Number,
  })
  issue: number | null;

  @ApiProperty({
    example: 0,
    description: 'Number of claps (reader appreciation) received',
  })
  claps: number;
}

export class NewsComment {
  @ApiProperty({
    example: 1,
    description: 'Comment ID',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'News ID the comment belongs to',
  })
  newsId: number;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Comment author UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 'Furretgamer99',
    description: 'Comment author username',
  })
  username: string;

  @ApiProperty({
    example: 'Great update!',
    description: 'Comment body',
  })
  body: string;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'Comment creation date',
  })
  createdAt: Date;
}

export class EditorialBoardMember {
  @ApiProperty({
    example: 'Ada Furret',
    description: 'Byline author name',
  })
  author: string;

  @ApiProperty({
    example: 'Editora de comunidad',
    description: 'Author masthead role',
    nullable: true,
    type: String,
  })
  authorRole: string | null;

  @ApiProperty({
    example: 12,
    description: 'Number of published articles by this author',
  })
  articles: number;
}

export class NewsIssue {
  @ApiProperty({
    example: 12,
    description: 'Magazine issue number',
  })
  issue: number;

  @ApiProperty({
    example: 5,
    description: 'Number of articles in this issue',
  })
  articles: number;

  @ApiProperty({
    example: 'Exciting New Features Released!',
    description:
      'Headline article title for this issue (featured article, or newest if none is featured)',
  })
  headline: string;

  @ApiProperty({
    example: '2025-06-14T12:00:00.000Z',
    description: 'Publication date of the issue (most recent article)',
  })
  publishedAt: Date;
}

export class ClapResponse {
  @ApiProperty({
    example: 1,
    description: 'News ID',
  })
  id: number;

  @ApiProperty({
    example: 43,
    description: 'Updated clap count',
  })
  claps: number;
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
