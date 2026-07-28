import { ApiProperty } from '@nestjs/swagger';

/**
 * The mod posts fire-and-forget and ignores this body; it exists so the route is typed
 * in Swagger and in the generated shared package.
 */
export class SaveRaceResponse {
  @ApiProperty({ description: 'Whether the race was persisted', example: true })
  saved: boolean;

  @ApiProperty({ description: 'Id of the stored race', example: 42 })
  id: number;
}
