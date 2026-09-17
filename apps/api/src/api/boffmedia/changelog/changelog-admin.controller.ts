import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import {
  AdminChangelogListQueryDto,
  CreateChangelogDto,
  UpdateChangelogDto,
} from './dto/changelog.dto';
import { ChangelogService } from './changelog.service';
import { ChangelogAdminItemEntity } from './entities/changelog.entity';

@ApiTags('BoffMedia | Changelog Administration')
@ApiBearerAuth('JWT')
@Clients(CLIENT.WEB)
@Controller('changelogs/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT)
export class ChangelogAdminController {
  constructor(private readonly service: ChangelogService) {}

  @Get()
  @ApiOperation({ summary: 'List changelog entries for administration' })
  @ApiResponse({ status: 200, type: [ChangelogAdminItemEntity] })
  list(@Query() query: AdminChangelogListQueryDto) {
    return this.service.listAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read a changelog entry for administration' })
  @ApiResponse({ status: 200, type: ChangelogAdminItemEntity })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft changelog entry' })
  @ApiResponse({ status: 201, type: ChangelogAdminItemEntity })
  create(
    @Body() dto: CreateChangelogDto,
    @Req() req: { user: { userId: number } },
  ) {
    return this.service.create(dto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a changelog entry' })
  @ApiResponse({ status: 200, type: ChangelogAdminItemEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChangelogDto,
    @Req() req: { user: { userId: number } },
  ) {
    return this.service.update(id, dto, req.user.userId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a reviewed changelog entry' })
  @ApiResponse({ status: 200, type: ChangelogAdminItemEntity })
  publish(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { userId: number } },
  ) {
    return this.service.publish(id, req.user.userId);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a changelog entry' })
  @ApiResponse({ status: 200, type: ChangelogAdminItemEntity })
  unpublish(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { userId: number } },
  ) {
    return this.service.unpublish(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft changelog entry' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
