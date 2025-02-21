import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'The title of the event' })
  title: string;

  @ApiProperty({ description: 'The description of the event' })
  description: string;

  @ApiProperty({ description: 'The game ID' })
  gameId: number;

  @ApiProperty({ description: 'The start date of the event' })
  startDate: string;

  @ApiProperty({ description: 'The end date of the event' })
  endDate: string;

  @ApiProperty({ description: 'The visibility of the event (public/private)' })
  visibility: 'public' | 'private';

  @ApiProperty({ description: 'The type of event (event/server)' })
  type: 'event' | 'server';

  @ApiProperty({ description: 'The icon of the event' })
  icon: string;

  @ApiProperty({ description: 'The banner of the event' })
  banner: string;
}