import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CLIENT, Clients } from '@api/_utils/decorators/clients.decorator';
import { OptionalAuth } from '@api/_utils/decorators/optional-auth.decorator';
import { ListReleasesQueryDto } from './dto/releases.dto';
import { ReleaseEntity } from './entities/releases.entity';
import { ReleasesService } from './releases.service';

@ApiTags('BoffMedia | Releases')
@Controller('releases')
export class ReleasesController {
  constructor(private readonly service: ReleasesService) {}

  @Get()
  @OptionalAuth()
  @ApiOperation({ summary: 'Published product changelog releases' })
  @ApiResponse({ status: 200, type: [ReleaseEntity] })
  list(@Query() query: ListReleasesQueryDto, @Req() req: Request) {
    const userId = (req as Request & { user?: { userId?: number } }).user
      ?.userId;
    return this.service.listPublic(query, userId);
  }

  @Post(':id/seen')
  @Clients(CLIENT.WEB, CLIENT.DESKTOP)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mark a product release as seen' })
  async markSeen(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = (req as Request & { user?: { userId?: number } }).user
      ?.userId;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.service.markSeen(id, userId);
  }
}
