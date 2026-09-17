import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { Clients, CLIENT } from '@api/_utils/decorators/clients.decorator';
import { OptionalAuth } from '@api/_utils/decorators/optional-auth.decorator';
import { Public } from '@api/_utils/decorators/public.decorator';
import type { AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import {
  ChangelogListQueryDto,
  MarkChangelogSeenDto,
} from './dto/changelog.dto';
import {
  ChangelogAuthGuard,
  OptionalChangelogAuthGuard,
} from './guards/changelog-auth.guard';
import { ChangelogService } from './changelog.service';
import {
  ChangelogListEntity,
  ChangelogSeenEntity,
} from './entities/changelog.entity';

@ApiTags('BoffMedia | Changelog')
@ApiBearerAuth('JWT')
@Controller('changelogs')
export class ChangelogController {
  constructor(private readonly service: ChangelogService) {}

  @Get()
  @Public()
  @OptionalAuth()
  @Clients(CLIENT.WEB, CLIENT.DESKTOP)
  @UseGuards(OptionalChangelogAuthGuard)
  @ApiOperation({ summary: 'List published customer-facing changelog entries' })
  @ApiResponse({ status: HttpStatus.OK, type: ChangelogListEntity })
  list(
    @Query() query: ChangelogListQueryDto,
    @Req() req: { user?: AuthPrincipal },
  ): Promise<ChangelogListEntity> {
    return this.service.listPublic(query, req.user?.userId);
  }

  @Post('seen')
  @Public()
  @Clients(CLIENT.WEB, CLIENT.DESKTOP)
  @UseGuards(ChangelogAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance the current account changelog cursor' })
  @ApiResponse({ status: HttpStatus.OK, type: ChangelogSeenEntity })
  markSeen(
    @Body() dto: MarkChangelogSeenDto,
    @Req() req: { user: AuthPrincipal },
  ): Promise<ChangelogSeenEntity> {
    return this.service.markSeen(req.user.userId, dto);
  }
}
