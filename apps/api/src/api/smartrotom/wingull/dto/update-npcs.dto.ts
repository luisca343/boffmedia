import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

/**
 * NPC roster pushed verbatim to the external Wingull game server. Individual
 * NPC records are opaque to this API, so only the top-level `npcs` array is
 * validated here.
 */
export class UpdateNpcsDto extends BaseDto {
  @ApiProperty({
    description: 'NPC records to update in the game world',
    type: [Object],
  })
  @IsArray()
  npcs: unknown[];
}
