import { ApiProperty } from "@nestjs/swagger";
import { PokemonData } from "../pokemon/utils/PokemonData";
import { SmartrotomRequestDto } from "./smartrotom-request-dto";

export class BattleAchievementDto extends SmartrotomRequestDto{
    @ApiProperty({ description: 'Victory status' })
    victoria: boolean;
  
    @ApiProperty({ description: 'Achievement name' })
    logro: string;
  
    @ApiProperty({ description: 'Name of the first player' })
    name1: string;
  
    @ApiProperty({ description: 'Name of the second player' })
    name2: string;
  
    @ApiProperty({ description: 'Team of the first player' })
    team1: PokemonData[];
  
    @ApiProperty({ description: 'Team of the second player' })
    team2: PokemonData[];
  
    @ApiProperty({ description: 'Replay data' })
    replay: string;
  }