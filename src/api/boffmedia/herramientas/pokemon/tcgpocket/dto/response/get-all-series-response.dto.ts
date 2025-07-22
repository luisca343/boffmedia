import { ApiProperty } from '@nestjs/swagger';
import { TcgSeriesEntity } from '../../entities/tcg-series.entity';

export class GetAllSeriesResponseDto {
  @ApiProperty({ 
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'List of TCG series',
    type: [TcgSeriesEntity]
  })
  data: TcgSeriesEntity[];

  @ApiProperty({ 
    description: 'Total number of series',
    example: 5
  })
  count: number;
}
