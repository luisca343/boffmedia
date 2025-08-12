import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponse {
  @ApiProperty({ 
    example: true, 
    description: 'Whether the operation was successful' 
  })
  success: boolean;

  @ApiProperty({ 
    example: 'Operation completed successfully', 
    description: 'Success message',
    required: false
  })
  message?: string;
}