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

  @ApiProperty({
    description: 'URL absoluta desde la que el updater descarga el bundle',
  })
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
    description:
      'Clave `{os}-{arch}`: windows-x86_64, darwin-aarch64, linux-x86_64…',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(UpdaterPlatformEntity) },
  })
  platforms!: Record<string, UpdaterPlatformEntity>;
}

/**
 * Una descarga pública del launcher: lo que la web enseña en /launcher.
 *
 * Lleva el SHA-512 a propósito. El binario NO va firmado con Authenticode, así
 * que Windows avisa de «editor desconocido» en la primera instalación y el hash
 * publicado es lo único que permite a alguien comprobar que el archivo que se ha
 * bajado es el que publicamos. Lo calcula el servidor sobre los bytes recibidos
 * (nunca lo manda el cliente), y es el mismo valor que verifica el instalador.
 */
export class DesktopDownloadEntity {
  @ApiProperty({ example: 'windows-x86_64' })
  target!: string;

  @ApiProperty({ example: '0.0.2' })
  version!: string;

  @ApiProperty({ example: 'BoffmediaApp_0.0.2_x64-setup.exe' })
  artifactName!: string;

  @ApiProperty({ description: 'URL absoluta de descarga directa' })
  url!: string;

  @ApiProperty({ description: 'SHA-512 en hex, calculado por el servidor' })
  sha512!: string;

  @ApiProperty() sizeBytes!: number;

  // `type: String` es obligatorio: sin él Swagger no puede inferir el tipo de una
  // propiedad opcional y emite un objeto libre, que `generate:shared` traduce a
  // Record<string, any> y no se puede ni pintar en un JSX.
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Notas de versión (markdown)',
  })
  notes!: string | null;

  @ApiProperty({ description: 'RFC 3339' })
  publishedAt!: string;
}

/** Una release en el panel de administración. La firma no se devuelve aquí. */
export class DesktopReleaseEntity {
  @ApiProperty() id!: number;

  @ApiProperty({ example: '1.4.0' })
  version!: string;

  @ApiProperty({ example: 'windows-x86_64' })
  target!: string;

  @ApiPropertyOptional({ type: String, nullable: true }) notes!: string | null;

  @ApiProperty({ example: 'boffmedia-app_1.4.0_x64_en-US.msi' })
  artifactName!: string;

  @ApiProperty({
    description: 'Calculado por el servidor sobre los bytes recibidos',
  })
  artifactSha512!: string;

  @ApiProperty() sizeBytes!: number;

  @ApiProperty({ description: 'Solo las publicadas aparecen en el feed' })
  published!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true }) publishedAt!:
    | string
    | null;

  @ApiProperty() createdAt!: string;
}
