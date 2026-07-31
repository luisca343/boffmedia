import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';

/** One entry of the updater feed's `platforms` map. */
export class UpdaterPlatformEntity {
  @ApiProperty({ description: 'Firma minisign del artefacto (tauri signer)' })
  signature!: string;

  @ApiProperty({ description: 'URL absoluta desde la que el updater descarga el bundle' })
  url!: string;
}

/**
 * El documento que espera el plugin updater de Tauri v2. Los nombres de campo
 * son los suyos (`pub_date` en snake_case, no camelCase): esta respuesta se
 * sirve con @SkipEnvelope y sin el sobre `{success,data}` porque Tauri
 * deserializa el cuerpo tal cual.
 */
// Reached only through the additionalProperties $ref above, so Swagger would
// never register it and `pnpm generate:shared` dies on the dangling pointer.
@ApiExtraModels(UpdaterPlatformEntity)
export class UpdaterFeedEntity {
  @ApiProperty({ example: '1.4.0' })
  version!: string;

  @ApiProperty({ description: 'Notas de la versión, en markdown' })
  notes!: string;

  @ApiProperty({ description: 'RFC 3339', example: '2026-07-31T10:00:00.000Z' })
  pub_date!: string;

  @ApiProperty({
    description: 'Clave `{os}-{arch}`: windows-x86_64, darwin-aarch64, linux-x86_64…',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(UpdaterPlatformEntity) },
  })
  platforms!: Record<string, UpdaterPlatformEntity>;
}

/** Una release en el panel de administración. La firma no se devuelve aquí. */
export class LauncherReleaseEntity {
  @ApiProperty() id!: number;

  @ApiProperty({ example: '1.4.0' })
  version!: string;

  @ApiProperty({ example: 'windows-x86_64' })
  target!: string;

  @ApiPropertyOptional({ nullable: true }) notes!: string | null;

  @ApiProperty({ example: 'boff-launcher_1.4.0_x64_en-US.msi' })
  artifactName!: string;

  @ApiProperty({ description: 'Calculado por el servidor sobre los bytes recibidos' })
  artifactSha512!: string;

  @ApiProperty() sizeBytes!: number;

  @ApiProperty({ description: 'Solo las publicadas aparecen en el feed' })
  published!: boolean;

  @ApiPropertyOptional({ nullable: true }) publishedAt!: string | null;

  @ApiProperty() createdAt!: string;
}
