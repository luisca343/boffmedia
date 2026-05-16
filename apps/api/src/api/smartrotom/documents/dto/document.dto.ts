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

export class UpdateDocumentDto {
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
