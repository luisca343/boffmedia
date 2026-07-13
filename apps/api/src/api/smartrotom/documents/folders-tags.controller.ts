import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
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

import {
  CreateFolderDto,
  UpdateFolderDto,
  CreateTagDto,
  UpdateTagDto,
} from './dto/document.dto';

import { NoteFolder, NoteTag } from './entities/document.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

@ApiTags('SmartRotom | Documents')
@Controller('smartrotom/documents')
export class FoldersTagsController {
  constructor(
    private readonly documentsFacadeService: DocumentsFacadeService,
  ) {}

  @Public()
  @Get('folders/:uuid')
  @ApiOperation({ summary: 'List folders for a user' })
  @ApiResponse({ status: HttpStatus.OK, type: [NoteFolder] })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getFolders(@Param('uuid') uuid: string): Promise<NoteFolder[]> {
    return await this.documentsFacadeService.getFolders(uuid);
  }

  @Public()
  @Post('folders')
  @ApiOperation({ summary: 'Create a folder' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NoteFolder })
  @ApiBody({ type: CreateFolderDto })
  async createFolder(@Body() dto: CreateFolderDto): Promise<NoteFolder> {
    return await this.documentsFacadeService.createFolder({
      uuid: dto.uuid,
      name: dto.name,
      color: dto.color,
      parentId: dto.parentId ?? null,
    });
  }

  @Public()
  @Put('folders/:id')
  @ApiOperation({ summary: 'Update a folder' })
  @ApiResponse({ status: HttpStatus.OK, type: NoteFolder })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiBody({ type: UpdateFolderDto })
  async updateFolder(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
  ): Promise<NoteFolder> {
    const folderId = parseInt(id, 10);
    if (isNaN(folderId)) {
      throw new Error('Invalid folder ID');
    }
    return await this.documentsFacadeService.updateFolder(folderId, {
      name: dto.name,
      color: dto.color,
      parentId: dto.parentId,
    });
  }

  @Public()
  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  async deleteFolder(@Param('id') id: string): Promise<SuccessResponse> {
    const folderId = parseInt(id, 10);
    if (isNaN(folderId)) {
      throw new Error('Invalid folder ID');
    }
    return await this.documentsFacadeService.deleteFolder(folderId);
  }

  @Public()
  @Get('tags/:uuid')
  @ApiOperation({ summary: 'List tags for a user' })
  @ApiResponse({ status: HttpStatus.OK, type: [NoteTag] })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getTags(@Param('uuid') uuid: string): Promise<NoteTag[]> {
    return await this.documentsFacadeService.getTags(uuid);
  }

  @Public()
  @Post('tags')
  @ApiOperation({ summary: 'Create a tag' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NoteTag })
  @ApiBody({ type: CreateTagDto })
  async createTag(@Body() dto: CreateTagDto): Promise<NoteTag> {
    return await this.documentsFacadeService.createTag({
      uuid: dto.uuid,
      label: dto.label,
      color: dto.color,
    });
  }

  @Public()
  @Put('tags/:id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiBody({ type: UpdateTagDto })
  async updateTag(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<SuccessResponse> {
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      throw new Error('Invalid tag ID');
    }
    return await this.documentsFacadeService.updateTag(tagId, {
      label: dto.label,
      color: dto.color,
    });
  }

  @Public()
  @Delete('tags/:id')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  async deleteTag(@Param('id') id: string): Promise<SuccessResponse> {
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      throw new Error('Invalid tag ID');
    }
    return await this.documentsFacadeService.deleteTag(tagId);
  }

  @Public()
  @Post('document/:id/tag/:tagId')
  @ApiOperation({
    summary: 'Toggle a tag on a note (adds if absent, removes if present)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponse })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  async toggleNoteTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<{ success: boolean; applied: boolean }> {
    const documentId = parseInt(id, 10);
    const parsedTagId = parseInt(tagId, 10);
    if (isNaN(documentId) || isNaN(parsedTagId)) {
      throw new Error('Invalid document or tag ID');
    }
    return await this.documentsFacadeService.toggleNoteTag(
      documentId,
      parsedTagId,
    );
  }
}
