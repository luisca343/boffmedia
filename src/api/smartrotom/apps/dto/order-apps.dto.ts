import { ApiProperty } from '@nestjs/swagger';

export class OrderAppDto {
  @ApiProperty({ description: 'The new order of the apps' })
  newOrder: { id: number; order: number }[];

  @ApiProperty({ description: 'The UUID of the user' })
  uuid: string;
}