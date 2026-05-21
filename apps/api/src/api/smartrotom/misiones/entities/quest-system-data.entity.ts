import { ApiProperty } from '@nestjs/swagger';
import { Quest } from './quest.entity';
import { Dialogue } from './dialogue.entity';
import { QuestCategory } from './quest-category.entity';
import { NPC } from './npc.entity';

export class QuestSystemData {
  @ApiProperty({
    description: 'Available quests',
    type: [Quest],
  })
  quests: Quest[];

  @ApiProperty({
    description: 'Quest categories',
    type: [QuestCategory],
  })
  categories: QuestCategory[];

  @ApiProperty({
    description: 'Available dialogues',
    type: [Dialogue],
  })
  dialogs: Dialogue[];

  @ApiProperty({
    description: 'NPCs in the system',
    type: [NPC],
  })
  npcs: NPC[];
}
