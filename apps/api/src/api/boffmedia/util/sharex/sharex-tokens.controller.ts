import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { SharexTokensService } from './sharex-tokens.service';
import { CreateSharexTokenDto } from './dto/sharex-token.dto';
import {
  SharexTokenEntity,
  CreatedSharexTokenEntity,
} from './entities/sharex-token.entity';

type AuthedRequest = { user: { userId: number; roles?: string[] } };

/**
 * Deliberately a separate controller from `SharexController`.
 *
 * That one carries a class-level `@Public()` — which would turn a route-level
 * `@UseGuards(JwtAuthGuard)` here into a silent no-op, because the global guard
 * short-circuits on the class flag before authenticating. Keeping the admin
 * routes on their own un-public controller means the guards actually run.
 */
@ApiTags('BoffMedia 🛠 | ShareX')
@Controller('sharex/tokens')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN)
export class SharexTokensController {
  constructor(private readonly tokens: SharexTokensService) {}

  @Get()
  @ApiOperation({ summary: 'List ShareX upload tokens (admin)' })
  @ApiResponse({ status: HttpStatus.OK, type: [SharexTokenEntity] })
  async list(): Promise<SharexTokenEntity[]> {
    return this.tokens.list();
  }

  @Post()
  @ApiOperation({
    summary: 'Issue a ShareX upload token (admin)',
    description:
      'The plaintext token is in the response and is never retrievable again — ' +
      'only its SHA-256 is stored. Give it to the holder and have them put it in ' +
      "their uploader's `key` field.",
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreatedSharexTokenEntity })
  async create(
    @Body() dto: CreateSharexTokenDto,
    @Req() req: AuthedRequest,
  ): Promise<CreatedSharexTokenEntity> {
    return this.tokens.create(dto.label, req.user?.userId ?? null);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Revoke a ShareX upload token (admin)',
    description:
      'A soft delete. The row stays so the images it already uploaded remain ' +
      'attributable; the token stops authenticating immediately.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: SharexTokenEntity })
  async revoke(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SharexTokenEntity> {
    return this.tokens.revoke(id);
  }
}
