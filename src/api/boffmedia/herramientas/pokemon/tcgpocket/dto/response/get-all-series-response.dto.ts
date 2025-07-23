import { ApiProperty } from '@nestjs/swagger';
import { TcgSeries } from '../../entities/tcg-series.entity';

export class GetAllSeriesResponseDto {
  @ApiProperty({ 
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'List of TCG series',
    type: [TcgSeries]
  })
  data: TcgSeries[];

  @ApiProperty({ 
    description: 'Total number of series',
    example: 5
  })
  count: number;
}
