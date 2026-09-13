import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { CLIENT, Clients } from '@api/_utils/decorators/clients.decorator';
import { CreateReleaseDto, WithdrawReleaseDto } from './dto/releases.dto';
import {
  ReleaseEntity,
  ReleaseReadinessEntity,
} from './entities/releases.entity';
import { ReleasesService } from './releases.service';

@ApiTags('BoffMedia | Release Admin')
@ApiBearerAuth('JWT')
@Controller('admin/releases')
@Clients(CLIENT.WEB)
@UseGuards(JwtAuthGuard, FullSessionGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_RELEASE)
export class ReleasesAdminController {
  constructor(private readonly service: ReleasesService) {}

  @Get()
  @ApiOperation({ summary: 'List product releases for administration' })
  @ApiResponse({ status: 200, type: [ReleaseEntity] })
  list(): Promise<ReleaseEntity[]> {
    return this.service.listAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create a manual product release draft' })
  @ApiResponse({ status: 201, type: ReleaseEntity })
  create(
    @Body() dto: CreateReleaseDto,
    @Req() req: Request,
  ): Promise<ReleaseEntity> {
    return this.service.createManual(dto, this.actorId(req));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a product release draft' })
  @ApiResponse({ status: 200, type: ReleaseEntity })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<ReleaseEntity> {
    return this.service.approve(id, this.actorId(req));
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a product release draft' })
  @ApiResponse({ status: 200, type: ReleaseEntity })
  archive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<ReleaseEntity> {
    return this.service.archive(id, this.actorId(req));
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw a published product release' })
  @ApiResponse({ status: 200, type: ReleaseEntity })
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: WithdrawReleaseDto,
    @Req() req: Request,
  ): Promise<ReleaseEntity> {
    return this.service.withdraw(id, dto, this.actorId(req));
  }

  @Get(':id/readiness')
  @ApiOperation({ summary: 'Show deployment readiness for a release' })
  @ApiResponse({ status: 200, type: ReleaseReadinessEntity })
  readiness(@Param('id', ParseIntPipe) id: number) {
    return this.service.readiness(id);
  }

  private actorId(req: Request): number {
    const userId = (req as Request & { user?: { userId?: number } }).user
      ?.userId;
    if (!userId) throw new Error('Authenticated release actor is missing');
    return userId;
  }
}
