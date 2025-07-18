import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

export class GetSetsDto extends BaseDto {}

export class ScrapeBattlesDto extends BaseDto {}

export class StartFetchDto extends BaseDto {}

export class GetFetchStatusDto extends BaseDto {}

export class GetBattleDataDto extends BaseDto {
  @ApiProperty({ 
    description: 'Battle URL to scrape',
    example: 'https://www.serebii.net/tcgpocket/battles/solo/battle1.shtml' 
  })
  @IsString()
  battleUrl: string;
}