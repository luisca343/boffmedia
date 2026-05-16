import { ApiProperty } from '@nestjs/swagger';
import { Quest } from './quest.entity';
import { Dialogue } from './dialogue.entity';
import { QuestCategory } from './quest-category.entity';
import { NPC } from './npc.entity';

export class UserQuestData {
  @ApiProperty({
    description: 'User-specific quest data with progress',
    type: [Quest],
  })
  quests: Quest[];

  @ApiProperty({
    description: 'Available dialogues for user',
    type: [Dialogue],
  })
  dialogs: Dialogue[];

  @ApiProperty({
    description: 'Quest categories',
    type: [QuestCategory],
  })
  categories: QuestCategory[];

  @ApiProperty({
    description: 'NPCs available to user',
    type: [NPC],
  })
  npcs: NPC[];
}
