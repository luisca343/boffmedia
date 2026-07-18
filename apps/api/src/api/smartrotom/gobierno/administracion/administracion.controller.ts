import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { ActorBodyDto } from '../_shared/dto/actor-body.dto';
import { AdministracionService } from './administracion.service';
import {
  CreateNpcSkinDto,
  UpdateNpcSkinDto,
  SendMegafoniaDto,
  ListMegafoniaQueryDto,
  CreateCartelDto,
  UpdateCartelDto,
  ListCartelesQueryDto,
} from './dto/administracion.dto';
import {
  GobiernoNpcSkinEntity,
  GobiernoMegafoniaEntity,
  GobiernoCartelEntity,
} from './entities/administracion.entity';

@ApiTags('SmartRotom | Gobierno | Administracion')
@Controller('smartrotom/gobierno/administracion')
export class AdministracionController {
  constructor(private readonly administracionService: AdministracionService) {}

  // ==================== NPC SKINS ====================

  @Get('npc-skins')
  @Public()
  @ApiOperation({ summary: 'List NPC skin configs' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoNpcSkinEntity] })
  async listNpcSkins(): Promise<GobiernoNpcSkinEntity[]> {
    return this.administracionService.listNpcSkins();
  }

  @Get('npc-skins/:skin')
  @Public()
  @ApiOperation({ summary: 'Get an NPC skin config' })
  @ApiParam({ name: 'skin', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoNpcSkinEntity })
  async getNpcSkin(
    @Param('skin') skin: string,
  ): Promise<GobiernoNpcSkinEntity> {
    return this.administracionService.getNpcSkin(skin);
  }

  @Post('npc-skins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an NPC skin config' })
  @ApiBody({ type: CreateNpcSkinDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoNpcSkinEntity })
  async createNpcSkin(
    @Body() dto: CreateNpcSkinDto,
  ): Promise<GobiernoNpcSkinEntity> {
    return this.administracionService.createNpcSkin(dto);
  }

  @Patch('npc-skins/:skin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an NPC skin config' })
  @ApiParam({ name: 'skin', type: String })
  @ApiBody({ type: UpdateNpcSkinDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoNpcSkinEntity })
  async updateNpcSkin(
    @Param('skin') skin: string,
    @Body() dto: UpdateNpcSkinDto,
  ): Promise<GobiernoNpcSkinEntity> {
    return this.administracionService.updateNpcSkin(skin, dto);
  }

  @Delete('npc-skins/:skin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an NPC skin config' })
  @ApiParam({ name: 'skin', type: String })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteNpcSkin(
    @Param('skin') skin: string,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.administracionService.deleteNpcSkin(skin, dto.actorUuid);
  }

  // ==================== MEGAFONIA ====================

  @Get('megafonia')
  @Public()
  @ApiOperation({ summary: 'List broadcast history' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoMegafoniaEntity] })
  async listMegafonia(
    @Query() query: ListMegafoniaQueryDto,
  ): Promise<GobiernoMegafoniaEntity[]> {
    return this.administracionService.listMegafonia(query.limit ?? 50);
  }

  @Post('megafonia/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Broadcast a message to the in-game global chat and record it',
  })
  @ApiBody({ type: SendMegafoniaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: [GobiernoMegafoniaEntity] })
  async sendMegafonia(
    @Body() dto: SendMegafoniaDto,
  ): Promise<GobiernoMegafoniaEntity[]> {
    return this.administracionService.sendMegafonia(dto);
  }

  // ==================== CARTELES ====================

  @Get('carteles')
  @Public()
  @ApiOperation({ summary: 'List saved sign configs' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoCartelEntity] })
  async listCarteles(
    @Query() query: ListCartelesQueryDto,
  ): Promise<GobiernoCartelEntity[]> {
    return this.administracionService.listCarteles(query.highway);
  }

  @Get('carteles/:id')
  @Public()
  @ApiOperation({ summary: 'Get a cartel by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoCartelEntity })
  async getCartel(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoCartelEntity> {
    return this.administracionService.getCartel(id);
  }

  @Post('carteles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a sign config' })
  @ApiBody({ type: CreateCartelDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoCartelEntity })
  async createCartel(
    @Body() dto: CreateCartelDto,
  ): Promise<GobiernoCartelEntity> {
    return this.administracionService.createCartel(dto);
  }

  @Patch('carteles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a cartel' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCartelDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoCartelEntity })
  async updateCartel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartelDto,
  ): Promise<GobiernoCartelEntity> {
    return this.administracionService.updateCartel(id, dto);
  }

  @Delete('carteles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a cartel' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteCartel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.administracionService.deleteCartel(id, dto.actorUuid);
  }
}
