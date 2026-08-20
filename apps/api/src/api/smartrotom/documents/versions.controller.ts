import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';
import { DocumentsFacadeService } from './documents.facade.service';

import { CreateVersionDto } from './dto/document.dto';

import { Document, NoteVersion } from './entities/document.entity';

/**
 * Note version history. Every route proves the caller holds the document first
 * — reading someone else's revision history is the same disclosure as reading
 * the note. The snapshot author is the authenticated principal, never
 * `dto.authorUuid` — that is whatever the client typed.
 */
@ApiTags('SmartRotom | Documents')
@ApiBearerAuth()
@Controller('smartrotom/documents')
export class VersionsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  @Get('document/:id/versions')
  @ApiOperation({ summary: 'List version history for a note the caller owns' })
  @ApiResponse({ status: HttpStatus.OK, type: [NoteVersion] })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getVersions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<NoteVersion[]> {
    await this.documentsFacadeService.getDocumentById(id, uuid);
    return await this.documentsFacadeService.getVersions(id);
  }

  @Post('document/:id/versions')
  @ApiOperation({ summary: 'Snapshot the current note content as a version' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NoteVersion })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: CreateVersionDto })
  async snapshotVersion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVersionDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<NoteVersion> {
    await this.documentsFacadeService.getDocumentById(id, uuid);
    return await this.documentsFacadeService.snapshotVersion(
      id,
      dto.label,
      uuid,
    );
  }

  @Post('versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a note the caller owns to a version' })
  @ApiResponse({ status: HttpStatus.OK, type: Document })
  @ApiParam({ name: 'versionId', description: 'Version ID' })
  async restoreVersion(
    @Param('versionId', ParseIntPipe) versionId: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<Document> {
    return await this.documentsFacadeService.restoreVersion(versionId, uuid);
  }
}
