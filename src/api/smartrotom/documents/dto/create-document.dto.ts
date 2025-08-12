import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateDocumentDto extends BaseDto {
  @ApiProperty({ description: 'Title of the document' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Content of the document' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Type of the document' })
  @IsInt()
  @IsNotEmpty()
  type: number;

  @ApiProperty({ description: 'Public status of the document (0=private, 1=public)' })
  @IsInt()
  @IsNotEmpty()
  public: number;
}

export class CreateDocumentDtoWithUuid extends CreateDocumentDto {
  @ApiProperty({ description: 'UUID of the user' })
  @IsString()
  @IsNotEmpty()
  uuid: string;
}
