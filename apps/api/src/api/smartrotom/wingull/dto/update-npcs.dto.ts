import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

/**
 * NPC roster pushed verbatim to the external Wingull game server. Individual
 * NPC records are opaque to this API, so only the top-level `npcs` array is
 * validated here.
 *
 * Named distinctly from misiones' `UpdateNPCsDto`: `generate:shared` derives one
 * model file per class name, and two names differing only in casing produce two
 * files that TypeScript rejects as a casing collision.
 */
export class UpdateWingullNpcsDto extends BaseDto {
  @ApiProperty({
    description: 'NPC records to update in the game world',
    type: [Object],
  })
  @IsArray()
  npcs: unknown[];
}
