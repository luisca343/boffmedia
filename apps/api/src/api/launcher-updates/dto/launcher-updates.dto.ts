import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

/**
 * Metadatos de una subida de artefacto. Van en la query porque el CUERPO son
 * los bytes crudos del bundle (application/octet-stream): no hay sitio para un
 * JSON, y multer/multipart obligaría a bufferizar 100+ MB en memoria.
 *
 * Ruta fuera de /smartrotom: no extiende BaseDto y el MinecraftMiddleware no la
 * toca.
 */
export class PublishReleaseQueryDto {
  @ApiProperty({ example: '1.4.0', description: 'Semver, sin la `v` inicial' })
  @IsString()
  @Matches(/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, {
    message: 'version must be semver',
  })
  version!: string;

  @ApiProperty({
    example: 'windows-x86_64',
    description: 'Clave de plataforma de Tauri: `{os}-{arch}`',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+-[a-zA-Z0-9_]+$/, { message: 'invalid tauri target' })
  target!: string;

  @ApiPropertyOptional({ description: 'Notas de la versión (markdown)' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  notes?: string;
}
