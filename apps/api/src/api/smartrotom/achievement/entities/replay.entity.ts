import { ApiProperty } from '@nestjs/swagger';

export class Replay {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the replay',
  })
  id: number;

  @ApiProperty({
    example: 'Luisca343',
    description: 'Player 1 name',
  })
  side1: string;

  @ApiProperty({
    example: 'Aquiles',
    description: 'Player 2 name',
  })
  side2: string;

  @ApiProperty({
    example:
      '[{"dex":777,"nature":"Serious","species":"Togedemaru","form":"","palette":"none","name":"Togedemaru","level":100,"item":"item.minecraft.air","ability":"Lightning Rod","moves":["Fake Out","Nuzzle","Thunderbolt","Spiky Shield"],"ivs":[17,10,19,30,9,23],"evs":[252,0,3,252,3,0],"stats":[320,211,150,178,160,220]},{"dex":792,"nature":"Jolly","species":"Lunala","form":"","palette":"none","name":"Lunala","level":100,"item":"item.minecraft.air","ability":"Shadow Shield","moves":["Moongeist Beam","Moonlight","Moonblast","Trick Room"],"ivs":[28,31,2,31,31,7],"evs":[0,96,148,152,54,60],"stats":[412,286,222,313,263,243]}]',
    description: 'Player 1 team data (JSON string)',
  })
  team1: string;

  @ApiProperty({
    example:
      '[{"dex":272,"nature":"Modest","species":"Ludicolo","form":"","palette":"none","name":"Ludicolo","level":1,"item":"Assault Vest","ability":"Swift Swim","moves":["Bubble Beam","Energy Ball","Mist","Water Gun"],"ivs":[31,31,31,31,31,31],"evs":[236,0,0,252,0,0],"stats":[13,5,6,7,7,6]},{"dex":279,"nature":"Modest","species":"Pelipper","form":"","palette":"none","name":"Pelipper","level":1,"item":"item.minecraft.air","ability":"Drizzle","moves":["Surf","Hurricane","Tailwind","Protect"],"ivs":[31,31,31,31,31,31],"evs":[252,0,4,252,0,0],"stats":[13,5,7,7,6,6]}]',
    description: 'Player 2 team data (JSON string)',
  })
  team2: string;

  @ApiProperty({
    example:
      '|player|p1|player:67d9b543-5ac9-41e1-a8a5-20d7689e24a4:Luisca343\n|player|p2|npc:Aquiles\n|teamsize|p1|6\n|teamsize|p2|6\n|gametype|doubles\n|gen|9\n|tier|Circuito de Gimnasios de Teras\n|start\n|switch|p1a: Togedemaru|Togedemaru, L100|320\\/320\n|switch|p2a: Ludicolo|Ludicolo, L1|13\\/13\n|turn|1\n|win|Luisca343\n',
    description: 'Battle replay data',
  })
  replay: string;

  @ApiProperty({
    example: 'Luisca343',
    description: 'Winner of the battle',
  })
  winner: string;

  @ApiProperty({
    example: '2025-06-13T19:08:49.000Z',
    description: 'When the replay was created',
  })
  date: Date;
}

export class UserReplay {
  @ApiProperty({
    example: 456,
    description: 'Unique identifier for the user-replay relation',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Replay ID',
  })
  replayId: number;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Player UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 1,
    description: 'Player side (1 or 2)',
  })
  side: number;

  @ApiProperty({
    example: '2025-06-13T19:08:49.000Z',
    description: 'When the relation was created',
  })
  createdAt: Date;
}
