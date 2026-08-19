import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Delete,
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

import {
  CreateFolderDto,
  UpdateFolderDto,
  CreateTagDto,
  UpdateTagDto,
} from './dto/document.dto';

import { NoteFolder, NoteTag } from './entities/document.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

/**
 * Note folders and tags.
 *
 * The owner is the authenticated principal. These routes used to be `@Public()`
 * and read the owner from `:uuid` or `dto.uuid`, so listing (and deleting)
 * another player's folders was a URL edit away. Writes are additionally
 * owner-scoped in SQL — see `note-organization.repository.ts`.
 */
@ApiTags('SmartRotom | Documents')
@ApiBearerAuth()
@Controller('smartrotom/documents')
export class FoldersTagsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  @Get('folders')
  @ApiOperation({ summary: "List the caller's folders" })
  @ApiResponse({ status: HttpStatus.OK, type: [NoteFolder] })
  async getFolders(@CurrentMcUuid() uuid: string): Promise<NoteFolder[]> {
    return await this.documentsFacadeService.getFolders(uuid);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create a folder owned by the caller' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NoteFolder })
  @ApiBody({ type: CreateFolderDto })
  async createFolder(
    @Body() dto: CreateFolderDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<NoteFolder> {
    return await this.documentsFacadeService.createFolder({
      uuid,
      name: dto.name,
      color: dto.color,
      parentId: dto.parentId,
    });
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Rename or recolour a folder the caller owns' })
  @ApiResponse({ status: HttpStatus.OK, type: NoteFolder })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiBody({ type: UpdateFolderDto })
  async updateFolder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<NoteFolder> {
    return await this.documentsFacadeService.updateFolder(id, uuid, {
      name: dto.name,
      color: dto.color,
      parentId: dto.parentId,
    });
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete a folder the caller owns' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  async deleteFolder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.deleteFolder(id, uuid);
  }

  @Get('tags')
  @ApiOperation({ summary: "List the caller's tags" })
  @ApiResponse({ status: HttpStatus.OK, type: [NoteTag] })
  async getTags(@CurrentMcUuid() uuid: string): Promise<NoteTag[]> {
    return await this.documentsFacadeService.getTags(uuid);
  }

  @Post('tags')
  @ApiOperation({ summary: 'Create a tag owned by the caller' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NoteTag })
  @ApiBody({ type: CreateTagDto })
  async createTag(
    @Body() dto: CreateTagDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<NoteTag> {
    return await this.documentsFacadeService.createTag({
      uuid,
      label: dto.label,
      color: dto.color,
    });
  }

  @Put('tags/:id')
  @ApiOperation({ summary: 'Rename or recolour a tag the caller owns' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiBody({ type: UpdateTagDto })
  async updateTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTagDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.updateTag(id, uuid, {
      label: dto.label,
      color: dto.color,
    });
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Delete a tag the caller owns' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  async deleteTag(
    @Param('id', ParseIntPipe) id: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    return await this.documentsFacadeService.deleteTag(id, uuid);
  }

  @Post('document/:id/tag/:tagId')
  @ApiOperation({
    summary: 'Toggle a tag on a note (adds if absent, removes if present)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  async toggleNoteTag(
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
    @CurrentMcUuid() uuid: string,
  ): Promise<{ success: boolean; applied: boolean }> {
    // Both halves have to be the caller's: the note, and the tag being applied.
    await this.documentsFacadeService.getDocumentById(id, uuid);
    const tags = await this.documentsFacadeService.getTags(uuid);
    if (!tags.some((t) => t.id === tagId)) {
      return { success: false, applied: false };
    }
    return await this.documentsFacadeService.toggleNoteTag(id, tagId);
  }
}
