import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadResponse {
  @ApiProperty({
    description: 'Upload status',
    example: 'OK',
  })
  status: string;

  @ApiProperty({
    description: 'File path (if successful)',
    example: './public/smartrotom/img/customNPC/renders/professor_oak.png',
    required: false,
  })
  path?: string;

  @ApiProperty({
    description: 'Error message (if failed)',
    required: false,
  })
  error?: string;
}

export class ImageExistsResponse {
  @ApiProperty({
    description: 'Whether image exists',
    example: true,
  })
  exists: boolean;

  @ApiProperty({
    description: 'File path (if exists)',
    example: './public/smartrotom/img/customNPC/professor_oak.png',
    required: false,
  })
  path?: string;
}
