import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsFacadeService } from './documents.facade.service';

import { CreateVersionDto } from './dto/document.dto';

import { Document, NoteVersion } from './entities/document.entity';

@ApiTags('SmartRotom | Documents')
@Controller('smartrotom/documents')
export class VersionsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  @Public()
  @Get('document/:id/versions')
  @ApiOperation({ summary: 'List version history for a note' })
  @ApiResponse({ status: HttpStatus.OK, type: [NoteVersion] })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async getVersions(@Param('id') id: string): Promise<NoteVersion[]> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.getVersions(documentId);
  }

  @Public()
  @Post('document/:id/versions')
  @ApiOperation({ summary: 'Snapshot the current note content as a version' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NoteVersion })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({ type: CreateVersionDto })
  async snapshotVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
  ): Promise<NoteVersion> {
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      throw new Error('Invalid document ID');
    }
    return await this.documentsFacadeService.snapshotVersion(
      documentId,
      dto.label,
      dto.authorUuid,
    );
  }

  @Public()
  @Post('versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a note to a previous version' })
  @ApiResponse({ status: HttpStatus.OK, type: Document })
  @ApiParam({ name: 'versionId', description: 'Version ID' })
  async restoreVersion(
    @Param('versionId') versionId: string,
  ): Promise<Document> {
    const parsedVersionId = parseInt(versionId, 10);
    if (isNaN(parsedVersionId)) {
      throw new Error('Invalid version ID');
    }
    return await this.documentsFacadeService.restoreVersion(parsedVersionId);
  }
}
