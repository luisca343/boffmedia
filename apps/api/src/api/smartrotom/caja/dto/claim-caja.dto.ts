import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

/** The sources a ticket may redeem. See CajaRepository for why this is a closed set. */
export const CAJA_SOURCES = ['mine', 'arcade', 'daily_reward'] as const;
export type CajaSource = (typeof CAJA_SOURCES)[number];

/**
 * The mod's claim body. Deliberately NOT a `BaseDto`: the mod sends no `server`
 * field, and this route is on the `MinecraftMiddleware` exclude list for that
 * reason. Adding `server` here would be a lie about who calls it.
 */
export class ClaimCajaDto {
  @ApiProperty({
    description:
      'The player, read by the mod off the connection — never supplied by the page.',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description:
      'Which ledger source to redeem. Mandatory: there is no "everything owed" — ' +
      'the phrase is not well-defined across sources (see CajaRepository).',
    enum: CAJA_SOURCES,
    example: 'mine',
  })
  @IsNotEmpty()
  @IsIn(CAJA_SOURCES)
  source: CajaSource;
}
