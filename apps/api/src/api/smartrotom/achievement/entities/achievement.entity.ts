import { ApiProperty } from '@nestjs/swagger';

export class Achievement {
  @ApiProperty({
    example: 'medalla_denki',
    description: 'Unique identifier for the achievement',
  })
  id: string;

  @ApiProperty({
    example: 'Medalla Denki',
    description: 'Achievement name',
  })
  name: string;

  @ApiProperty({
    example: 'Win your first battle against another player',
    description: 'Achievement description',
  })
  description: string;

  @ApiProperty({
    example: '/icons/achievements/medalla_denki.png',
    description: 'Achievement icon path',
  })
  icon: string;

  @ApiProperty({
    example: 'medallas',
    description: 'Achievement category',
  })
  category: string;

  @ApiProperty({
    example: 'narukami-akina',
    description: 'Achievement subcategory',
  })
  subcategory: string;

  @ApiProperty({
    example: 1,
    description: 'Target value to complete the achievement',
  })
  target: number;

  @ApiProperty({
    example: 1,
    description: 'Display order',
  })
  order: number;
}

export class UserAchievement extends Achievement {
  @ApiProperty({
    example: 1,
    description: 'Battle/Data ID associated with this achievement',
  })
  battleId: number;

  @ApiProperty({
    example: 1,
    description: 'Current progress towards the achievement',
  })
  progress: number;

  @ApiProperty({
    example: 1,
    description: 'Completion status (0 = not completed, 1 = completed)',
  })
  completed: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'When the achievement was completed',
  })
  completedAt: Date;

  @ApiProperty({
    example: '007d1a64-661c-4396-8844-e27856f2ddfa',
    description: 'Player UUID',
  })
  uuid: string;

  @ApiProperty({
    example:
      '[{\"dex\":777,\"nature\":\"Serious\",\"species\":\"Togedemaru\",\"form\":\"\",\"palette\":\"none\",\"name\":\"Togedemaru\",\"level\":100,\"item\":\"item.minecraft.air\",\"ability\":\"Lightning Rod\",\"moves\":[\"Fake Out\",\"Nuzzle\",\"Thunderbolt\",\"Spiky Shield\"],\"ivs\":[17,10,19,30,9,23],\"evs\":[252,0,3,252,3,0],\"stats\":[320,211,150,178,160,220]},{\"dex\":792,\"nature\":\"Jolly\",\"species\":\"Lunala\",\"form\":\"\",\"palette\":\"none\",\"name\":\"Lunala\",\"level\":100,\"item\":\"item.minecraft.air\",\"ability\":\"Shadow Shield\",\"moves\":[\"Moongeist Beam\",\"Moonlight\",\"Moonblast\",\"Trick Room\"],\"ivs\":[28,31,2,31,31,7],\"evs\":[0,96,148,152,54,60],\"stats\":[412,286,222,313,263,243]},{\"dex\":10,\"nature\":\"Hardy\",\"species\":\"Caterpie\",\"form\":\"\",\"palette\":\"shiny2\",\"name\":\"Caterpie\",\"level\":6,\"item\":\"item.minecraft.air\",\"ability\":\"Shield Dust\",\"moves\":[\"String Shot\",\"Tackle\",null,null],\"ivs\":[21,13,25,18,10,27],\"evs\":[0,0,0,0,0,0],\"stats\":[22,9,10,8,8,12]},{\"dex\":324,\"nature\":\"Careful\",\"species\":\"Torkoal\",\"form\":\"\",\"palette\":\"none\",\"name\":\"El Torko§r\",\"level\":100,\"item\":\"item.minecraft.air\",\"ability\":\"Drought\",\"moves\":[\"Eruption\",\"Heat Wave\",\"Protect\",\"Earth Power\"],\"ivs\":[7,21,0,20,0,23],\"evs\":[2,104,148,143,54,59],\"stats\":[257,222,322,207,173,82]},{\"dex\":987,\"nature\":\"Adamant\",\"species\":\"FlutterMane\",\"form\":\"\",\"palette\":\"none\",\"name\":\"Flutter Mane\",\"level\":100,\"item\":\"item.minecraft.air\",\"ability\":\"Protosynthesis\",\"moves\":[\"Dazzling Gleam\",\"Moonblast\",\"Wish\",\"Power Gem\"],\"ivs\":[15,1,26,29,22,27],\"evs\":[0,54,135,117,66,22],\"stats\":[235,141,174,299,313,307]},{\"dex\":890,\"nature\":\"Hasty\",\"species\":\"Eternatus\",\"form\":\"ordinary\",\"palette\":\"none\",\"name\":\"Eternatus\",\"level\":1,\"item\":\"item.minecraft.air\",\"ability\":\"Pressure\",\"moves\":[\"Agility\",\"Confuse Ray\",\"Dragon Tail\",\"Poison Tail\"],\"ivs\":[25,31,20,31,31,12],\"evs\":[0,0,0,0,0,0],\"stats\":[14,7,6,8,7,7]}]',
    description: 'Team data used for the achievement',
  })
  team: string;

  @ApiProperty({
    example:
      '|player|p1|player:67d9b543-5ac9-41e1-a8a5-20d7689e24a4:Luisca343\n|player|p2|npc:Aquiles\n|teamsize|p1|6\n|teamsize|p2|6\n|gametype|doubles\n|gen|9\n|tier|Circuito de Gimnasios de Teras\n|start\n|switch|p1a: Togedemaru|Togedemaru, L100|320\\/320\n|switch|p2a: Ludicolo|Ludicolo, L1|13\\/13\n|turn|1\n|\n|t:|1749841704\n|-weather|RainDance|\n|move|p1a: Togedemaru|Fake Out|p2a: Ludicolo|\n|-damage|p2a: Ludicolo|0 fnt\n|faint|p2a: Ludicolo\n|-status|p1a: Togedemaru|brn\n|turn|2\n|\n|t:|1749841706\n|switch|p2a: Dracovish|Dracovish, L1|13\\/13\n|move|p1a: Togedemaru|Thunderbolt|p2a: Dracovish|\n|-damage|p2a: Dracovish|0 fnt\n|faint|p2a: Dracovish\n|-status|p1a: Togedemaru|brn\n|turn|3\n|\n|t:|1749841710\n|switch|p2a: Pelipper|Pelipper, L1|13\\/13\n|move|p1a: Togedemaru|Thunderbolt|p2a: Pelipper|\n|-damage|p2a: Pelipper|1\\/13\n|move|p2a: Pelipper|Tailwind|p2a: Pelipper|\n|-activate|p2a: Pelipper|move: Tailwind\n|turn|4\n|\n|t:|1749841716\n|move|p1a: Togedemaru|Thunderbolt|p2a: Pelipper|\n|-damage|p2a: Pelipper|0 fnt\n|faint|p2a: Pelipper\n|-status|p1a: Togedemaru|brn\n|turn|5\n|\n|t:|1749841719\n|switch|p2a: Rotom|Rotom, L1|12\\/12\n|-status|p1a: Togedemaru|brn\n|move|p1a: Togedemaru|Thunderbolt|p2a: Rotom|\n|-damage|p2a: Rotom|0 fnt\n|faint|p2a: Rotom\n|turn|6\n|\n|t:|1749841722\n|switch|p2a: Barraskewda|Barraskewda, L1|12\\/12\n|move|p1a: Togedemaru|Thunderbolt|p2a: Barraskewda|\n|-damage|p2a: Barraskewda|0 fnt\n|faint|p2a: Barraskewda\n|turn|7\n|\n|t:|1749841726\n|switch|p2a: Gyarados|Gyarados, L1|13\\/13\n|move|p1a: Togedemaru|Thunderbolt|p2a: Gyarados|\n|-damage|p2a: Gyarados|0 fnt\n|faint|p2a: Gyarados\n|win|Luisca343\n',
    description: 'Battle replay data',
  })
  replay: string;
}
