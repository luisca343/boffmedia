import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { PoblacionService } from './poblacion.service';
import {
  ListCensoQueryDto,
  GrantRoleDto,
  RevokeRoleDto,
} from './dto/poblacion.dto';
import {
  GobiernoCensoEntity,
  GobiernoCensoListEntity,
  GobiernoOficialEntity,
} from './entities/poblacion.entity';

@ApiTags('SmartRotom | Gobierno | Poblacion')
@Public()
@Controller('smartrotom/gobierno/poblacion')
export class PoblacionController {
  constructor(private readonly poblacionService: PoblacionService) {}

  @Get('censo')
  @ApiOperation({
    summary:
      'Derived census: every player with their civic standing and parcelas owned',
  })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoCensoListEntity })
  async listCenso(
    @Query() query: ListCensoQueryDto,
  ): Promise<GobiernoCensoListEntity> {
    return this.poblacionService.listCenso(query);
  }

  @Get('censo/:uuid')
  @ApiOperation({
    summary:
      "One citizen's derived record — what the dossier drawer opens with, from any name in the app",
  })
  @ApiParam({ name: 'uuid', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoCensoEntity })
  async getCiudadano(
    @Param('uuid') uuid: string,
  ): Promise<GobiernoCensoEntity> {
    return this.poblacionService.getCiudadano(uuid);
  }

  @Get('oficiales')
  @ApiOperation({
    summary: 'List everyone holding a gobierno role, with their highest rank',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoOficialEntity] })
  async listOficiales(): Promise<GobiernoOficialEntity[]> {
    return this.poblacionService.listOficiales();
  }

  @Post('oficiales/:uuid/roles')
  @ApiOperation({ summary: 'Grant a gobierno role to a player' })
  @ApiParam({ name: 'uuid', type: String })
  @ApiBody({ type: GrantRoleDto })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoOficialEntity] })
  async grantRole(
    @Param('uuid') uuid: string,
    @Body() dto: GrantRoleDto,
  ): Promise<GobiernoOficialEntity[]> {
    return this.poblacionService.grantRole(uuid, dto);
  }

  @Delete('oficiales/:uuid/roles/:role')
  @ApiOperation({ summary: 'Revoke a gobierno role from a player' })
  @ApiParam({ name: 'uuid', type: String })
  @ApiParam({ name: 'role', type: String })
  @ApiBody({ type: RevokeRoleDto })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoOficialEntity] })
  async revokeRole(
    @Param('uuid') uuid: string,
    @Param('role') role: string,
    @Body() dto: RevokeRoleDto,
  ): Promise<GobiernoOficialEntity[]> {
    return this.poblacionService.revokeRole(uuid, role, dto);
  }
}
