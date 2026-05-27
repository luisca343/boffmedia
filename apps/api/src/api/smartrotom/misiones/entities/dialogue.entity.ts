import { ApiProperty } from '@nestjs/swagger';
import { QuestRequirements } from './quest.entity';

export class NpcLocation {
  @ApiProperty({
    description: 'NPC display name',
    example: 'David el Divertido',
  })
  name: string;

  @ApiProperty({
    description: 'Dialog ID this location belongs to',
    example: 7,
  })
  dialogId: number;

  @ApiProperty({ description: 'Skin file name', example: 'dave_the_diver.png' })
  skin: string;

  @ApiProperty({ description: 'World X coordinate', example: -284.5 })
  x: number;

  @ApiProperty({ description: 'World Y coordinate', example: 64 })
  y: number;

  @ApiProperty({ description: 'World Z coordinate', example: 67.5 })
  z: number;

  @ApiProperty({
    description: 'Minecraft world name',
    example: 'minecraft:overworld',
  })
  world: string;

  @ApiProperty({
    description: 'NPC entity UUID',
    example: '425bfabe-f06d-4109-bba8-389f4b1668cd',
  })
  uuid: string;
}

export class Dialogue {
  @ApiProperty({
    description: 'Dialogue ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Dialogue name/title',
    example: 'Professor Oak Introduction',
  })
  name: string;

  @ApiProperty({
    description: 'Dialogue text content',
    example: 'Welcome to the world of Pokemon!',
  })
  text: string;

  @ApiProperty({
    description: 'Associated quest ID',
    example: 1,
  })
  questId: number;

  @ApiProperty({
    description: 'Dialogue requirements',
    type: QuestRequirements,
  })
  requirements: QuestRequirements;

  @ApiProperty({
    description: 'NPC world locations for this dialogue',
    type: NpcLocation,
    isArray: true,
  })
  npcLocations: NpcLocation[];
}
