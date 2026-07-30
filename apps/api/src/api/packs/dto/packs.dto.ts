import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const ACCESS_KINDS = ['public', 'password', 'allowlist'] as const;
const LOADERS = ['forge', 'neoforge', 'fabric-loader', 'quilt-loader'] as const;

/** Dashed lowercase UUID — the form `rotom_users.uuid` stores. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreatePackDto {
  @ApiProperty({ example: 'boff-smp' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug debe ser kebab-case en minúsculas',
  })
  @MaxLength(64)
  slug!: string;

  @ApiProperty({ example: 'Boff SMP' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  iconUrl?: string;

  @ApiProperty({ enum: ACCESS_KINDS, default: 'allowlist' })
  @IsIn(ACCESS_KINDS)
  accessKind!: (typeof ACCESS_KINDS)[number];

  @ApiPropertyOptional({ description: 'Obligatoria cuando accessKind es "password"' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}

export class UpdatePackDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  iconUrl?: string;

  @ApiPropertyOptional({ enum: ACCESS_KINDS })
  @IsOptional()
  @IsIn(ACCESS_KINDS)
  accessKind?: (typeof ACCESS_KINDS)[number];

  @ApiPropertyOptional({ description: 'Cadena vacía para quitar la contraseña' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class CreateVersionDto {
  @ApiProperty({ example: '1.4.2' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;

  @ApiProperty({ example: '1.21.4' })
  @IsString()
  @MaxLength(32)
  minecraft!: string;

  @ApiPropertyOptional({ enum: LOADERS })
  @IsOptional()
  @IsIn(LOADERS)
  loader?: (typeof LOADERS)[number];

  @ApiPropertyOptional({ example: '21.4.30' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  loaderVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description:
      'PackFile[] — validado con @boffmedia/pack-schema, el mismo esquema del que el launcher genera sus tipos de Rust',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  files!: unknown[];
}

export class GrantAccessDto {
  @ApiProperty({ example: '069a79f4-44e9-4726-a5be-fca90e38aaf5' })
  @IsString()
  @Matches(UUID_RE, { message: 'UUID de Minecraft no válido' })
  uuid!: string;
}

export class CreateInviteDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'ISO-8601' })
  @IsOptional()
  // @Type is mandatory alongside @IsDate: without it a round-tripped ISO string
  // arrives as a string and fails validation, 400-ing the whole request.
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}

// ── Launcher-facing ────────────────────────────────────────────────────────

export class VerifyJoinDto {
  @ApiProperty({ description: 'Nombre de usuario de Minecraft' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username!: string;

  @ApiProperty({ description: 'El serverId devuelto por /packs/auth/challenge' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  serverId!: string;
}

export class ManifestQueryDto {
  @ApiPropertyOptional({ description: 'Solo para packs protegidos con contraseña' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class RedeemInviteDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  code!: string;
}
