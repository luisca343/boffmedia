import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import {
  CurrentUser,
  type AuthPrincipal,
} from '@api/_utils/decorators/current-user.decorator';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import type { DataExport } from '@/_db/schema/BoffMediaDataExports';

import { DataExportService } from './data-export.service';
import { DataExportStatusEntity } from './entities/data-export-status.entity';
import { CLIENT, Clients } from '@api/_utils/decorators/clients.decorator';

/**
 * "Download everything you hold on me" (GDPR art. 15 / 20).
 *
 * Every route is `me`-scoped and reads the account off the token, never off a
 * path parameter: there is no id to get wrong, so there is no IDOR to review.
 *
 * `FullSessionGuard` alongside `JwtAuthGuard` because an `ingame` session proves
 * control of a Minecraft account, not ownership of the Boffmedia account it is
 * linked to — and this is the one endpoint that hands over the whole account in
 * one file. Same guard the password and email routes carry, for the same reason.
 */
@ApiTags('BoffMedia | Data export')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, FullSessionGuard)
// A GDPR export is an account-level action: website sign-in only.
@Clients(CLIENT.WEB)
@Controller('users/me/data-export')
export class DataExportController {
  constructor(private readonly service: DataExportService) {}

  @Post()
  // The real limit is the per-account cooldown in the service (default 24h).
  // This one only stops a stuck button from writing rows.
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @ApiOperation({ summary: 'Request a copy of everything we hold on you' })
  @ApiResponse({ status: 201, type: DataExportStatusEntity })
  @ApiResponse({ status: 400, description: 'Asked again inside the cooldown' })
  async request(
    @CurrentUser() user: AuthPrincipal,
  ): Promise<DataExportStatusEntity> {
    return present(await this.service.request(user.userId));
  }

  @Get()
  @ApiOperation({ summary: 'State of your most recent export request' })
  @ApiResponse({ status: 200, type: DataExportStatusEntity })
  async status(
    @CurrentUser() user: AuthPrincipal,
  ): Promise<DataExportStatusEntity | null> {
    const row = await this.service.status(user.userId);
    return row ? present(row) : null;
  }

  // ownership-ok: service.open(user.userId, id) scopes to the caller's userId.
  @Get(':id/download')
  @ApiOperation({ summary: 'Download a prepared export' })
  @ApiResponse({
    status: 200,
    description: 'The archive, as a JSON attachment',
  })
  @ApiResponse({ status: 403, description: 'Not your export' })
  async download(
    @CurrentUser() user: AuthPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.service.open(user.userId, id);

    // `no-store`: an archive of one person's whole account has no business in a
    // proxy or a browser cache.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename.replace(/"/g, '')}"`,
    );

    return new StreamableFile(file.stream);
  }
}

/** Row -> wire. `filename` never crosses this boundary. */
function present(row: DataExport): DataExportStatusEntity {
  return {
    id: row.id,
    status: row.status,
    requestedAt: row.requestedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    sizeBytes: row.sizeBytes ?? null,
  };
}
