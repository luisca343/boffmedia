import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsBoolean, IsArray } from 'class-validator';
export class BattleAchievementDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Achievement ID to unlock',
    example: 'medalla_denki'
  })
  @IsNotEmpty()
  @IsString()
  logro: string;

  @ApiProperty({ 
    description: 'Player 1 name',
    example: 'Luisca343'
  })
  @IsNotEmpty()
  @IsString()
  name1: string;

  @ApiProperty({ 
    description: 'Player 2 name',
    example: 'Aquiles'
  })
  @IsNotEmpty()
  @IsString()
  name2: string;

  @ApiProperty({ 
    description: 'Player 1 team data',
    example: [
      {
        "dex": 777,
        "nature": "Serious",
        "species": "Togedemaru",
        "form": "",
        "palette": "none",
        "name": "Togedemaru",
        "level": 100,
        "item": "item.minecraft.air",
        "ability": "Lightning Rod",
        "moves": ["Fake Out", "Nuzzle", "Thunderbolt", "Spiky Shield"],
        "ivs": [17, 10, 19, 30, 9, 23],
        "evs": [252, 0, 3, 252, 3, 0],
        "stats": [320, 211, 150, 178, 160, 220]
      }
    ]
  })
  @IsNotEmpty()
  @IsArray()
  team1: any[];

  @ApiProperty({ 
    description: 'Player 2 team data',
    example: [
      {
        "dex": 272,
        "nature": "Modest",
        "species": "Ludicolo",
        "form": "",
        "palette": "none",
        "name": "Ludicolo",
        "level": 1,
        "item": "Assault Vest",
        "ability": "Swift Swim",
        "moves": ["Bubble Beam", "Energy Ball", "Mist", "Water Gun"],
        "ivs": [31, 31, 31, 31, 31, 31],
        "evs": [236, 0, 0, 252, 0, 0],
        "stats": [13, 5, 6, 7, 7, 6]
      }
    ]
  })
  @IsNotEmpty()
  @IsArray()
  team2: any[];

  @ApiProperty({ 
    description: 'Battle replay data',
    example: '|player|p1|player:67d9b543-5ac9-41e1-a8a5-20d7689e24a4:Luisca343\n|player|p2|npc:Aquiles\n|teamsize|p1|6\n|teamsize|p2|6\n|gametype|doubles\n|gen|9\n|tier|Circuito de Gimnasios de Teras\n|start\n|switch|p1a: Togedemaru|Togedemaru, L100|320\\/320\n|switch|p2a: Ludicolo|Ludicolo, L1|13\\/13\n|turn|1\n|win|Luisca343\n'
  })
  @IsNotEmpty()
  @IsString()
  replay: string;

  @ApiProperty({ 
    description: 'Whether the player won the battle',
    example: true
  })
  @IsNotEmpty()
  @IsBoolean()
  victoria: boolean;
}


export class BattleAchievementResponse {
  @ApiProperty({ 
    description: 'Whether the operation was successful',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Error message if operation failed',
    required: false
  })
  error?: string;

  @ApiProperty({ 
    description: 'ID of the created replay',
    required: false,
    example: 123
  })
  replayId?: number;
}