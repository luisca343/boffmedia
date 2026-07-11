import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** Rival's verdict on a pending self-report: confirm (true) or dispute. */
export class ConfirmReportDto {
  @ApiProperty({ description: 'true = verify and settle · false = dispute.' })
  @IsBoolean()
  accept: boolean;
}
