import { ApiProperty } from '@nestjs/swagger';
import { BaseSuccessResponse, BaseInsertResponse } from '@api/_utils/dto/base-responses.dto';

export class PtcgpOperationResultEntity extends BaseSuccessResponse {
  @ApiProperty({ 
    description: 'Additional operation data',
    required: false 
  })
  data?: any;
}

export class PtcgpCreateResultEntity extends BaseInsertResponse {
  @ApiProperty({ 
    description: 'Created resource data',
    required: false 
  })
  data?: any;
}

export class BatchUpdateResultEntity extends BaseSuccessResponse {
  @ApiProperty({ 
    description: 'Array of individual update results',
    type: [Object]
  })
  results: any[];

  @ApiProperty({ 
    example: 5, 
    description: 'Number of cards updated' 
  })
  updatedCount: number;
}