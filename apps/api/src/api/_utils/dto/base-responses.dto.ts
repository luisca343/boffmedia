import { ApiProperty } from '@nestjs/swagger';

export class BaseIdResponse {
  @ApiProperty({
    description: 'Generated ID',
    example: 123,
  })
  id: number;
}

export class BaseInsertResponse {
  @ApiProperty({
    description: 'Insert ID of the created record',
    example: 123,
  })
  insertId: number;
}

export class BaseSuccessResponse {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success or error message',
    example: 'Operation completed successfully',
  })
  message: string;
}

export class BaseStatusResponse {
  @ApiProperty({
    description: 'Status value',
    example: 1,
  })
  status: number | null;

  @ApiProperty({
    description: 'Error message if any',
    required: false,
  })
  error?: string;
}
