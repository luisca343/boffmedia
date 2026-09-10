import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { Clients, CLIENT } from '@api/_utils/decorators/clients.decorator';
import { MhwildsAnatomyService } from './services/mhwilds-anatomy.service';
import { SaveAnatomyOverrideDto } from './dto/anatomy-overrides.dto';
import {
  AnatomyOverrideEntity,
  DeleteAnatomyOverrideEntity,
} from './entities/anatomy-overrides.entity';

/**
 * The editor is deliberately separate from the public controller. The public
 * controller is class-level @Public(), while this controller is secure by
 * default and cannot accidentally inherit that metadata.
 */
@ApiTags('BoffMedia | MH Wilds Admin')
@ApiBearerAuth('JWT')
@Clients(CLIENT.WEB)
@Controller('tools/mhwilds/admin')
@UseGuards(JwtAuthGuard, FullSessionGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class MhwildsAnatomyAdminController {
  constructor(private readonly anatomy: MhwildsAnatomyService) {}

  @Patch('anatomy-overrides/:fixedId/:variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Save Hunter's Manual callout positions" })
  @ApiParam({ name: 'fixedId', example: -758250816 })
  @ApiParam({ name: 'variantId', example: '00' })
  @ApiBody({ type: SaveAnatomyOverrideDto })
  @ApiResponse({ status: HttpStatus.OK, type: AnatomyOverrideEntity })
  async save(
    @Param('fixedId', ParseIntPipe) fixedId: number,
    @Param('variantId') variantId: string,
    @Body() body: SaveAnatomyOverrideDto,
    @Req() req: { user: { userId: number } },
  ): Promise<AnatomyOverrideEntity> {
    // The identity belongs in the route so a client cannot accidentally save
    // one monster's payload under another monster's key.
    return this.anatomy.save({ ...body, fixedId, variantId }, req.user.userId);
  }

  @Delete('anatomy-overrides/:fixedId/:variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore generated positions for a monster variant',
  })
  @ApiParam({ name: 'fixedId', example: -758250816 })
  @ApiParam({ name: 'variantId', example: '00' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteAnatomyOverrideEntity })
  async remove(
    @Param('fixedId', ParseIntPipe) fixedId: number,
    @Param('variantId') variantId: string,
  ): Promise<DeleteAnatomyOverrideEntity> {
    return this.anatomy.remove(fixedId, variantId);
  }
}
