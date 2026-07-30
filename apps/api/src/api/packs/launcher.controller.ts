import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { LauncherAuthGuard, LauncherRequest } from './guards/launcher-auth.guard';
import { PacksAuthService } from './packs-auth.service';
import { PacksService } from './packs.service';
import { ManifestQueryDto, RedeemInviteDto, VerifyJoinDto } from './dto/packs.dto';
import {
  JoinChallengeEntity,
  LauncherPackEntity,
  LauncherSessionEntity,
} from './entities/packs.entity';

// The launcher's entire surface. HANDOFF §7.2 — identity is a Minecraft UUID
// proved through Mojang's hasJoined handshake, never a Boffmedia account, so a
// player who has never opened the website can still install a pack.
//
// `@Public()` is applied PER ROUTE, never on the class: it exempts these from
// the global JwtAuthGuard (a launcher token is not a website session), and the
// LauncherAuthGuard below does the real authentication itself.
@ApiTags('Packs | Launcher')
@Controller('packs/launcher')
export class LauncherController {
  constructor(
    private readonly auth: PacksAuthService,
    private readonly packs: PacksService,
  ) {}

  @Post('auth/challenge')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 1: obtener un serverId para el handshake de Mojang',
  })
  @ApiResponse({ status: HttpStatus.OK, type: JoinChallengeEntity })
  challenge(): JoinChallengeEntity {
    return this.auth.createChallenge();
  }

  @Post('auth/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 3: canjear el desafío por una sesión de launcher',
    description:
      'Entre el paso 1 y este, el launcher debe llamar a sessionserver.mojang.com/session/minecraft/join con el serverId.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: LauncherSessionEntity })
  async verify(@Body() dto: VerifyJoinDto): Promise<LauncherSessionEntity> {
    const principal = await this.auth.verify(dto.username, dto.serverId);
    return {
      token: this.auth.signSession(principal),
      uuid: principal.uuid,
      username: principal.username,
    };
  }

  @Get('packs')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Los packs a los que este UUID tiene acceso' })
  @ApiResponse({ status: HttpStatus.OK, type: [LauncherPackEntity] })
  async list(@Req() req: LauncherRequest): Promise<LauncherPackEntity[]> {
    return this.packs.listForLauncher(req.launcher!.uuid) as Promise<LauncherPackEntity[]>;
  }

  @Get('packs/:id/manifest')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'El manifiesto a instalar',
    description:
      'Revalida el acceso: el listado y la descarga son peticiones distintas y el acceso puede revocarse entre ambas.',
  })
  async manifest(
    @Param('id') id: string,
    @Query() query: ManifestQueryDto,
    @Req() req: LauncherRequest,
  ): Promise<unknown> {
    return this.packs.manifestFor(req.launcher!.uuid, id, query.password ?? null);
  }

  @Post('invites/redeem')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Canjear un código de invitación' })
  async redeem(
    @Body() dto: RedeemInviteDto,
    @Req() req: LauncherRequest,
  ): Promise<{ packId: string }> {
    return this.packs.redeemInvite(req.launcher!.uuid, dto.code);
  }
}
