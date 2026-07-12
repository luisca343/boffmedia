import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateDocumentDto extends BaseDto {
  @ApiProperty({
    description: 'Document title',
    example: 'My Important Notes',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Document content',
    example: 'This is the content of my document...',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Document type',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  type: number;
}

export class CreateDocumentDtoWithUuid extends CreateDocumentDto {
  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class UpdateDocumentDto extends BaseDto {
  @ApiProperty({
    description: 'Document title',
    example: 'Updated Document Title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Document content',
    example: 'Updated content...',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Document type',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  type?: number;

  @ApiProperty({
    description: 'Whether the document is public',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  public?: number;

  @ApiProperty({
    description: 'Whether the document is pinned (0 = no, 1 = pinned)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  pinned?: number;

  @ApiProperty({
    type: Number,
    description: 'Folder the document belongs to; null moves it to the root',
    example: 12,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  folderId?: number | null;
}

export class CreateFolderDto extends BaseDto {
  @ApiProperty({ description: 'Owner UUID', example: '67d9b543-...' })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Folder name', example: 'VGC 2026' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Semantic palette key',
    example: 'primary',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    type: Number,
    description: 'Parent folder ID for nesting',
    example: 5,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  parentId?: number | null;
}

export class UpdateFolderDto extends BaseDto {
  @ApiProperty({ description: 'Folder name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Semantic palette key', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    type: Number,
    description: 'Parent folder ID for nesting',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  parentId?: number | null;
}

export class CreateTagDto extends BaseDto {
  @ApiProperty({ description: 'Owner UUID', example: '67d9b543-...' })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Tag label', example: 'meta' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Semantic palette key',
    example: 'primary',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateTagDto extends BaseDto {
  @ApiProperty({ description: 'Tag label', required: false })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ description: 'Semantic palette key', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateVersionDto extends BaseDto {
  @ApiProperty({
    description: 'Optional label for the snapshot',
    required: false,
    example: 'Ajuste de velocidad',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    description: 'Author UUID producing the snapshot',
    required: false,
  })
  @IsOptional()
  @IsString()
  authorUuid?: string;
}

export class GetUserDocumentsDto {
  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class AddNoteToUserDto {
  @ApiProperty({
    description: 'Document ID',
    example: 123,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  documentId: number;

  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}
