import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MinecraftCustomStats {
  @ApiPropertyOptional({ type: 'number', example: 2 })
  'lootr:looted_stat'?: number;
  @ApiPropertyOptional({ type: 'number', example: 4 })
  'minecraft:interact_with_crafting_table'?: number;
  @ApiPropertyOptional({ type: 'number', example: 3115 })
  'minecraft:leave_game'?: number;
  @ApiPropertyOptional({ type: 'number', example: 1061280 })
  'minecraft:time_since_death'?: number;
  @ApiPropertyOptional({ type: 'number', example: 13880 })
  'minecraft:damage_resisted'?: number;
  @ApiPropertyOptional({ type: 'number', example: 13118184 })
  'minecraft:sprint_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 1304 })
  'minecraft:drop'?: number;
  @ApiPropertyOptional({ type: 'number', example: 13 })
  'minecraft:deaths'?: number;
  @ApiPropertyOptional({ type: 'number', example: 115136 })
  'minecraft:jump'?: number;
  @ApiPropertyOptional({ type: 'number', example: 199625 })
  'minecraft:walk_on_water_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 1 })
  'minecraft:interact_with_furnace'?: number;
  @ApiPropertyOptional({ type: 'number', example: 36411529 })
  'minecraft:play_one_minute'?: number;
  @ApiPropertyOptional({ type: 'number', example: 4352 })
  'minecraft:damage_dealt'?: number;
  @ApiPropertyOptional({ type: 'number', example: 1178396 })
  'minecraft:crouch_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 3 })
  'minecraft:inspect_dispenser'?: number;
  @ApiPropertyOptional({ type: 'number', example: 1004577 })
  'minecraft:horse_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 26 })
  'minecraft:mob_kills'?: number;
  @ApiPropertyOptional({ type: 'number', example: 10 })
  'minecraft:interact_with_anvil'?: number;
  @ApiPropertyOptional({ type: 'number', example: 9444019 })
  'minecraft:walk_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 574 })
  'minecraft:damage_dealt_absorbed'?: number;
  @ApiPropertyOptional({ type: 'number', example: 351296 })
  'minecraft:sneak_time'?: number;
  @ApiPropertyOptional({ type: 'number', example: 100524 })
  'minecraft:walk_under_water_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 14702 })
  'minecraft:boat_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 1061351 })
  'minecraft:time_since_rest'?: number;
  @ApiPropertyOptional({ type: 'number', example: 4282 })
  'minecraft:damage_taken'?: number;
  @ApiPropertyOptional({ type: 'number', example: 3559 })
  'minecraft:use_wand'?: number;
  @ApiPropertyOptional({ type: 'number', example: 29014 })
  'minecraft:swim_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 67615657 })
  'minecraft:fly_one_cm'?: number;
  @ApiPropertyOptional({ type: 'number', example: 36 })
  'minecraft:open_chest'?: number;
  @ApiPropertyOptional({ type: 'number', example: 61583 })
  'minecraft:fall_one_cm'?: number;
}

export class PlayerStats {
  @ApiPropertyOptional({
    type: 'object',
    description: 'minecraft:killed stats',
    additionalProperties: { type: 'number' },
  })
  'minecraft:killed'?: Record<string, number>;

  @ApiPropertyOptional({
    type: 'object',
    description: 'minecraft:picked_up stats',
    additionalProperties: { type: 'number' },
  })
  'minecraft:picked_up'?: Record<string, number>;

  @ApiPropertyOptional({
    type: 'object',
    description: 'minecraft:crafted stats',
    additionalProperties: { type: 'number' },
  })
  'minecraft:crafted'?: Record<string, number>;

  @ApiPropertyOptional({
    type: 'object',
    description: 'minecraft:used stats',
    additionalProperties: { type: 'number' },
  })
  'minecraft:used'?: Record<string, number>;

  @ApiPropertyOptional({
    type: () => MinecraftCustomStats,
    description: 'minecraft:custom stats',
  })
  'minecraft:custom'?: MinecraftCustomStats;

  @ApiPropertyOptional({
    type: 'object',
    description: 'minecraft:dropped stats',
    additionalProperties: { type: 'number' },
  })
  'minecraft:dropped'?: Record<string, number>;

  @ApiPropertyOptional({
    type: 'object',
    description: 'minecraft:mined stats',
    additionalProperties: { type: 'number' },
  })
  'minecraft:mined'?: Record<string, number>;

  @ApiProperty({ example: 2586, description: 'Minecraft data version' })
  DataVersion!: number;
}
