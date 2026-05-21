import { ApiProperty } from '@nestjs/swagger';
import { QuestStatus } from '../types';

export class QuestObjective {
  @ApiProperty({
    description: 'Objective name',
    example: 'Collect 10 berries',
  })
  name: string;

  @ApiProperty({
    description: 'Current progress',
    example: 5,
  })
  progress: number;

  @ApiProperty({
    description: 'Total required',
    example: 10,
  })
  total: number;
}

export class QuestReward {
  @ApiProperty({
    description: 'Item identifier',
    example: 'berry:oran',
  })
  item: string;

  @ApiProperty({
    description: 'Item count',
    example: 5,
  })
  count: number;
}

export class ScoreboardRequirements {
  @ApiProperty({
    description: 'Scoreboard objective name',
    example: 'pokemon_caught',
  })
  scoreboardObjective: string;

  @ApiProperty({
    description: 'Scoreboard type',
    example: 'dummy',
  })
  scoreboardType: string;

  @ApiProperty({
    description: 'Required value',
    example: 50,
  })
  scoreboardValue: number;
}

export class FactionRequirements {
  @ApiProperty({
    description: 'Faction ID',
    example: 1,
  })
  factionId: number;

  @ApiProperty({
    description: 'Faction availability',
    example: 'AVAILABLE',
  })
  factionAvailable: string;

  @ApiProperty({
    description: 'Faction stance',
    example: 'ALLIED',
  })
  factionStance: string;
}

export class QuestRequirements {
  @ApiProperty({
    description: 'Whether quest is available',
    example: true,
  })
  available: boolean;

  @ApiProperty({
    description: 'Required quest IDs',
    type: [Number],
    example: [1, 2, 3],
  })
  requiredQuests: number[];

  @ApiProperty({
    description: 'Required dialog IDs',
    type: [Number],
    example: [5, 6],
  })
  requiredDialogs: number[];

  @ApiProperty({
    description: 'Required player level',
    example: 10,
  })
  requiredLevel: number;

  @ApiProperty({
    description: 'Required time (timestamp)',
    example: 1640995200000,
  })
  requiredTime: number;

  @ApiProperty({
    description: 'Faction requirements',
    type: [FactionRequirements],
  })
  factionRequirements: FactionRequirements[];

  @ApiProperty({
    description: 'Scoreboard requirements',
    type: [ScoreboardRequirements],
  })
  scoreboardRequirements: ScoreboardRequirements[];
}

export class Quest {
  @ApiProperty({
    description: 'Quest ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Quest name',
    example: 'Berry Collector',
  })
  name: string;

  @ApiProperty({
    description: 'Quest log text',
    example: 'Collect berries for the local Pokemon center',
  })
  logText: string;

  @ApiProperty({
    description: 'Quest completion text',
    example: 'Great job! You collected all the berries.',
  })
  completeText: string;

  @ApiProperty({
    description: 'Whether quest is repeatable',
    example: false,
  })
  repeatable: boolean;

  @ApiProperty({
    description: 'Quest type ID',
    example: 1,
  })
  type: number;

  @ApiProperty({
    description: 'Next quest ID',
    example: 2,
  })
  nextQuest: number;

  @ApiProperty({
    description: 'Quest category',
    example: 'main',
  })
  category: string;

  @ApiProperty({
    description: 'Quest status',
    enum: QuestStatus,
    example: QuestStatus.AVAILABLE,
  })
  status: QuestStatus;

  @ApiProperty({
    description: 'Quest objectives',
    type: [QuestObjective],
  })
  objectives: QuestObjective[];

  @ApiProperty({
    description: 'Quest requirements',
    type: QuestRequirements,
  })
  requirements: QuestRequirements;

  @ApiProperty({
    description: 'Dialog ID',
    example: 10,
  })
  dialogId: number;

  @ApiProperty({
    description: 'Quest rewards',
    type: [QuestReward],
  })
  rewards: QuestReward[];
}
