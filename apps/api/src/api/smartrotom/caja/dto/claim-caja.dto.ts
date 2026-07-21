import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/** The sources a ticket may redeem. See CajaRepository for why this is a closed set. */
export const CAJA_SOURCES = ['mine', 'arcade', 'daily_reward'] as const;
export type CajaSource = (typeof CAJA_SOURCES)[number];

/**
 * The mod's claim body. NOT a `BaseDto`: the mod sends no `server` field, and this
 * route is on the `MinecraftMiddleware` exclude list.
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
      'Which ledger source to redeem. Mandatory — see CajaRepository.',
    enum: CAJA_SOURCES,
    example: 'mine',
  })
  @IsNotEmpty()
  @IsIn(CAJA_SOURCES)
  source: CajaSource;

  @ApiProperty({
    description:
      'Optional selector: redeem only these rows. Omit to redeem the whole source. ' +
      'Rows not owned or of another source are ignored — it selects, never describes the reward.',
    required: false,
    type: [Number],
    example: [12, 13],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  ids?: number[];
}

/** Finalizes a delivered reservation. Not a `BaseDto`, like `ClaimCajaDto`. */
export class ConfirmCajaDto {
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
      'The id returned by POST /caja/reserve for the grant that was just delivered.',
    example: '9b7c1f2e-3d4a-4b5c-8e9f-0a1b2c3d4e5f',
  })
  @IsNotEmpty()
  @IsUUID()
  reservationId: string;
}
