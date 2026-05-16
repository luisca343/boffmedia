import { ApiProperty } from '@nestjs/swagger';

export class QuestCategory {
  @ApiProperty({
    description: 'Quest IDs in this category',
    type: [Number],
    example: [1, 2, 3, 4],
  })
  quests: number[];
}
