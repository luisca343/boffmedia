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

export class DungeonRunParticipantDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ description: 'Player name at the time of the run', example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  nombre: string;

  @ApiProperty({ description: 'Deaths during the run', example: 2 })
  @IsInt()
  @Min(0)
  muertes: number;

  @ApiProperty({
    description: 'Whether this player left before the run ended',
    example: false,
  })
  @IsBoolean()
  abandono: boolean;
}

/**
 * The wire shape is the mod's, not ours — field names are Spanish because
 * `DungeonRunBodyTest` in the Teras repo pins them (docs/DUNGEONS.md §9). Renaming one
 * here fails that test rather than silently dropping a column.
 *
 * Extends BaseDto for the `server` field: this route keeps the `MinecraftMiddleware`
 * tripwire (the mod does send `server`), so it is NOT on the exclude list in app.module.
 */
export class SaveDungeonRunDto extends BaseDto {
  @ApiProperty({ description: 'Layout seed of the run', example: 'abc' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  semilla: string;

  @ApiProperty({ description: 'Stage the party started on', example: 1 })
  @IsInt()
  @Min(0)
  etapaInicial: number;

  @ApiProperty({ description: 'Stage the party reached', example: 4 })
  @IsInt()
  @Min(0)
  etapaFinal: number;

  @ApiProperty({ description: 'Floors cleared', example: 3 })
  @IsInt()
  @Min(0)
  pisosSuperados: number;

  @ApiProperty({ description: 'Whether the run was completed', example: true })
  @IsBoolean()
  completada: boolean;

  @ApiProperty({ description: 'Run duration in milliseconds', example: 725000 })
  @IsInt()
  @Min(0)
  duracionMs: number;

  @ApiProperty({
    description: 'Curse ids active during the run',
    example: ['LABYRINTH'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  @ArrayMaxSize(16)
  maldiciones: string[];

  @ApiProperty({ description: 'Coins the party earned', example: 480 })
  @IsInt()
  @Min(0)
  monedasGanadas: number;

  @ApiProperty({ description: 'Coins the party spent', example: 320 })
  @IsInt()
  @Min(0)
  monedasGastadas: number;

  @ApiProperty({ description: 'Coins cashed out to ₽', example: 1600 })
  @IsInt()
  @Min(0)
  monedasConvertidas: number;

  @ApiProperty({ description: 'Run end timestamp (epoch millis)', example: 1700000000000 })
  @IsInt()
  @Min(0)
  fecha: number;

  @ApiProperty({ description: 'Party members', type: [DungeonRunParticipantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DungeonRunParticipantDto)
  @ArrayMaxSize(8)
  participantes: DungeonRunParticipantDto[];
}
