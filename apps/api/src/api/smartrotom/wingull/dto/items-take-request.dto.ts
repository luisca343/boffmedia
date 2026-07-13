import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

// The take-side of the game-server bridge for items. Like /takepokemon, this does NOT EXIST
// YET on the plugin — the server can only /giveitems, and cannot even read a player's bag.
// Agreed contract:
//
//   POST /takeitems { uuid, items: [{ id, amount }] } -> { taken: [{ id, amount }] }
//
// `taken` is what the plugin ACTUALLY removed, which may be less than what was asked for if
// the player no longer holds it. Callers must settle against `taken`, never against `items`.
export class TakeItemDto {
  @ApiProperty({ example: 'pixelmon:master_ball' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  amount: number;
}

// Deliberately not a BaseDto: /wingull routes are the game-server bridge and sit
// outside MinecraftMiddleware's /smartrotom scope, so no `server` field arrives.
export class ItemsTakeRequestDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ type: TakeItemDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TakeItemDto)
  items: TakeItemDto[];
}

export class ItemsTakeResponse {
  @ApiProperty({
    type: TakeItemDto,
    isArray: true,
    description: 'What was actually removed from the player — settle against this.',
  })
  taken: TakeItemDto[];
}
