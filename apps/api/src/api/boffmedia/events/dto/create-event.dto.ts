import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    description: 'The ID of the parent event, if any',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiProperty({
    description: 'The title of the event',
    example: 'Summer Gaming Championship',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'The description of the event',
    example: 'A competitive gaming event for the summer season',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The game ID',
    example: 1,
  })
  @IsInt()
  @Min(1)
  gameId: number;

  @ApiProperty({
    description: 'The start date of the event',
    example: '2024-07-01T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'The end date of the event',
    example: '2024-07-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'The visibility of the event',
    enum: ['public', 'private'],
    example: 'public',
  })
  @IsEnum(['public', 'private'])
  visibility: 'public' | 'private';

  @ApiProperty({
    description: 'The type of event',
    enum: ['event', 'server'],
    example: 'event',
  })
  @IsEnum(['event', 'server'])
  type: 'event' | 'server';

  @ApiProperty({
    description: 'The icon of the event',
    example: '/icons/event-icon.png',
  })
  @IsString()
  @MaxLength(255)
  icon: string;

  @ApiProperty({
    description: 'The banner of the event',
    example: '/banners/event-banner.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  banner?: string;
}
