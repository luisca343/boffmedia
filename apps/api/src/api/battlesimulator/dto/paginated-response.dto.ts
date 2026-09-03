import { ApiProperty } from '@nestjs/swagger';

export class BattlesimPageDto<T> {
  @ApiProperty({
    description: 'Items in this page',
    isArray: true,
  })
  items: T[];

  @ApiProperty({
    description: 'Cursor for fetching next page, null if no more items',
    nullable: true,
  })
  cursor: string | null;
}
