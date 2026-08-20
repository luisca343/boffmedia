import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { DesktopUpdatesService } from './desktop-updates.service';
import { PublishReleaseQueryDto } from './dto/desktop-updates.dto';
import { DesktopReleaseEntity } from './entities/desktop-updates.entity';

/**
 * Publicación de versiones del launcher. Igual que PacksController: sin
 * @Public() de clase, guards por clase efectivos, solo BOFF_ADMIN.
 */
@ApiTags('Desktop | Admin')
@Controller('desktop/admin/releases')
@UseGuards(JwtAuthGuard, FullSessionGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN)
@ApiBearerAuth('JWT')
export class DesktopUpdatesAdminController {
  constructor(private readonly updates: DesktopUpdatesService) {}

  private actorId(req: { user?: { userId?: number } }): number | null {
    return req.user?.userId ?? null;
  }

  @Get()
  @ApiOperation({ summary: 'Todas las releases de la app' })
  @ApiResponse({ status: HttpStatus.OK, type: [DesktopReleaseEntity] })
  async list(): Promise<DesktopReleaseEntity[]> {
    return this.updates.list();
  }

  @Post()
  @ApiOperation({
    summary: 'Subir el bundle de una versión',
    description:
      'Cuerpo binario en crudo (application/octet-stream), sin multipart: `express.json()` está condicionado al content-type, así que el cuerpo llega sin consumir y va directo a disco. La firma viaja en la cabecera X-Updater-Signature y el nombre del archivo en X-Artifact-Filename; la extensión es significativa (.msi, .exe, .msi.zip, .nsis.zip, .AppImage.tar.gz) porque el updater elige su estrategia de instalación a partir de ella. El sha512 lo calcula el servidor. Re-subir la misma versión+plataforma reemplaza el artefacto. La release nace en borrador: hay que publicarla aparte.',
  })
  @ApiConsumes('application/octet-stream')
  @ApiHeader({
    name: 'X-Updater-Signature',
    description: 'Firma minisign generada por `tauri signer sign`',
    required: true,
  })
  @ApiHeader({
    name: 'X-Artifact-Filename',
    description: 'Nombre original del bundle, con su extensión',
    required: true,
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: DesktopReleaseEntity })
  async upload(
    @Query() query: PublishReleaseQueryDto,
    @Headers('x-updater-signature') signature: string,
    @Headers('x-artifact-filename') filename: string,
    @Req() req: Request,
  ): Promise<DesktopReleaseEntity> {
    return this.updates.publishArtifact(
      req,
      {
        version: query.version,
        target: query.target,
        signature: signature ?? '',
        notes: query.notes ?? null,
        filename: filename ?? '',
      },
      this.actorId(req as Request & { user?: { userId?: number } }),
    );
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar una release',
    description:
      'Hasta aquí es borrador: subir el bundle de Windows no debe ofrecer la actualización a máquinas cuyo bundle todavía no está subido.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DesktopReleaseEntity })
  async publish(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DesktopReleaseEntity> {
    return this.updates.setPublished(id, true);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Despublicar una release',
    description:
      'La saca del feed. Las instalaciones que ya se actualizaron no vuelven atrás.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DesktopReleaseEntity })
  async unpublish(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DesktopReleaseEntity> {
    return this.updates.setPublished(id, false);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrar una release y su artefacto' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: true }> {
    await this.updates.remove(id);
    return { success: true };
  }
}
