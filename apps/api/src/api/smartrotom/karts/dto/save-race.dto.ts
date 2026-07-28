import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RaceParticipantDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Player name at the time of the race',
    example: 'Ana',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  nombre: string;

  @ApiProperty({
    description:
      'Finishing position; a retired racer keeps the position they would have held',
    example: 1,
  })
  @IsInt()
  @Min(1)
  posicion: number;

  @ApiProperty({
    description: 'Total race time in milliseconds; -1 when they never finished',
    example: 90500,
  })
  @IsInt()
  // -1 is a sentinel, not a time: @Min(-1), never @IsPositive.
  @Min(-1)
  tiempoMs: number;

  @ApiProperty({
    description: 'Best lap in milliseconds; -1 when they completed no lap',
    example: 29800,
  })
  @IsInt()
  @Min(-1)
  mejorVueltaMs: number;

  @ApiProperty({ description: 'Laps actually driven', example: 3 })
  @IsInt()
  @Min(0)
  vueltasCompletadas: number;

  @ApiProperty({ description: 'Whether this racer did not finish', example: false })
  @IsBoolean()
  dnf: boolean;
}

/**
 * The wire shape is the mod's, not ours — field names are Spanish because unit tests in
 * the Teras repo pin them (docs/KARTS_CARRERA_HANDOFF.md §1). Renaming one here fails
 * that test rather than silently dropping a column.
 *
 * Extends BaseDto for the `server` field: this route keeps the `MinecraftMiddleware`
 * tripwire (the mod does send `server`), so it is NOT on the exclude list in app.module.
 */
export class SaveRaceDto extends BaseDto {
  @ApiProperty({ description: 'Circuit name', example: 'Rainbow Road' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  circuito: string;

  @ApiProperty({
    description: 'Race mode id from the mod',
    example: 'clasica',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  modo: string;

  @ApiProperty({ description: 'Laps the race was set to', example: 3 })
  @IsInt()
  @Min(0)
  vueltas: number;

  @ApiProperty({
    description: 'Race end timestamp (epoch millis)',
    example: 1737200000000,
  })
  @IsInt()
  @Min(0)
  fecha: number;

  @ApiProperty({ description: 'The grid', type: [RaceParticipantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RaceParticipantDto)
  @ArrayMaxSize(24)
  participantes: RaceParticipantDto[];
}
