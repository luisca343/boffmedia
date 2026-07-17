import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

/**
 * Absolute balance set (mod-only). NOT a `BaseDto`: like the caja routes it is
 * authed by the mod's Bearer via `GameServerAuthGuard` and is on the
 * `MinecraftMiddleware` exclude list, so it sends no `server` field — a mint route
 * must never inherit the public MC_WORLD tripwire.
 */
export class SetBalanceDto {
  @ApiProperty({
    description: 'UUID of the user whose main account balance is being set',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID(4, { message: 'UUID must be a valid v4 UUID' })
  uuid: string;

  @ApiProperty({
    description: 'Absolute target balance in PokéDollars (non-negative)',
    example: 5000,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber({}, { message: 'Balance must be a number' })
  @Min(0, { message: 'Balance must be non-negative' })
  balance: number;

  @ApiProperty({
    description: 'Ledger memo for the correction. Defaults server-side if omitted.',
    example: '[AJUSTE] Ajuste de saldo (admin)',
    required: false,
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: 'Concept must be between 1 and 255 characters' })
  concept?: string;
}
