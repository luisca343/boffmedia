import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    description: 'Image file to upload',
    required: true 
  })
  file: Express.Multer.File;

  @ApiProperty({ 
    type: 'string', 
    description: 'Subdirectory path within uploads folder',
    required: false,
    example: 'avatars'
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({ 
    type: 'string', 
    description: 'Custom filename (with extension)',
    required: false,
    example: 'profile-picture.jpg'
  })
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiProperty({ 
    type: 'number', 
    description: 'Maximum file size in MB',
    required: false,
    minimum: 1,
    maximum: 10,
    default: 5
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxSizeInMB?: number;
}

export class UploadFileDto {
  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    description: 'File to upload',
    required: true 
  })
  file: Express.Multer.File;

  @ApiProperty({ 
    type: 'string', 
    description: 'Subdirectory path within uploads folder',
    required: false 
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({ 
    type: 'string', 
    description: 'Custom filename (with extension)',
    required: false 
  })
  @IsString()
  @IsOptional()
  filename?: string;
}

export class DeleteFileDto {
  @ApiProperty({ 
    type: 'string', 
    description: 'Subdirectory path within uploads folder',
    required: false 
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({ 
    type: 'string', 
    description: 'Filename to delete',
    required: true 
  })
  @IsString()
  filename: string;
}