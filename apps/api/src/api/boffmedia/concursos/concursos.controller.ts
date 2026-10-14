import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { extractBearer } from '@api/_utils/auth/secret-compare';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ConcursosRoomsService } from './concursos-rooms.service';
import {
  ConcursosRoomDto,
  ConcursosSocketRequestDto,
  ConcursosSocketResponseDto,
  ConcursosConfigurationDto,
  ConcursosGroupDto,
  StartConcursosGameDto,
  ConcursosActionDto,
  CreateConcursosRoomDto,
  JoinConcursosRoomDto,
} from './concursos.dto';

@ApiExtraModels(ConcursosSocketRequestDto, ConcursosSocketResponseDto)
@ApiTags('Concursos')
@ApiBearerAuth('concursos-capability')
@Public()
@Controller('concursos/rooms')
export class ConcursosController {
  constructor(private readonly rooms: ConcursosRoomsService) {}

  @Post()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Create an anonymous contest lobby; same host capability retries idempotently',
  })
  @ApiResponse({ status: 201, type: ConcursosRoomDto })
  create(
    @Req() req: Request,
    @Body() _body: CreateConcursosRoomDto,
  ): ConcursosRoomDto {
    return this.rooms.create(extractBearer(req), req.ip ?? 'unknown');
  }

  @Post(':code/players')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Join a lobby with a nickname and a fresh anonymous member capability',
  })
  @ApiResponse({ status: 201, type: ConcursosRoomDto })
  join(
    @Param('code') code: string,
    @Body() body: JoinConcursosRoomDto,
    @Req() req: Request,
  ): ConcursosRoomDto {
    return this.rooms.join(code, extractBearer(req), body.nickname);
  }

  @Get(':code')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Read lobby and heartbeat as its host or a proven member',
  })
  @ApiResponse({ status: 200, type: ConcursosRoomDto })
  read(@Param('code') code: string, @Req() req: Request): ConcursosRoomDto {
    return this.rooms.read(code, extractBearer(req));
  }

  @Delete(':code')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Close a lobby as its host' })
  @ApiResponse({ status: 200, type: ConcursosRoomDto })
  close(@Param('code') code: string, @Req() req: Request): ConcursosRoomDto {
    return this.rooms.close(code, extractBearer(req));
  }

  @Delete(':code/players/me')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Leave your own lobby seat' })
  @ApiResponse({ status: 200, type: ConcursosRoomDto })
  leave(@Param('code') code: string, @Req() req: Request): ConcursosRoomDto {
    return this.rooms.leave(code, extractBearer(req));
  }
  @Post(':code/configuration')
  @Header('Cache-Control', 'no-store')
  @ApiResponse({ status: 201, type: ConcursosRoomDto })
  configure(
    @Param('code') code: string,
    @Body() body: ConcursosConfigurationDto,
    @Req() req: Request,
  ) {
    return this.rooms.configure(code, extractBearer(req), body.mode);
  }
  @Post(':code/group')
  @Header('Cache-Control', 'no-store')
  @ApiResponse({ status: 201, type: ConcursosRoomDto })
  group(
    @Param('code') code: string,
    @Body() body: ConcursosGroupDto,
    @Req() req: Request,
  ) {
    return this.rooms.group(code, extractBearer(req), body.entityId);
  }
  @Post(':code/game')
  @Header('Cache-Control', 'no-store')
  @ApiResponse({ status: 201, type: ConcursosRoomDto })
  start(
    @Param('code') code: string,
    @Body() body: StartConcursosGameDto,
    @Req() req: Request,
  ) {
    return this.rooms.startGame(code, extractBearer(req), body);
  }
  @Post(':code/game/actions')
  @Header('Cache-Control', 'no-store')
  @ApiResponse({ status: 201, type: ConcursosRoomDto })
  action(
    @Param('code') code: string,
    @Body() body: ConcursosActionDto,
    @Req() req: Request,
  ) {
    return this.rooms.action(code, extractBearer(req), body);
  }
}
