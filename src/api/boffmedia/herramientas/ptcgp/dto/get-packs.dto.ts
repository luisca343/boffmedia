import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { GetResourceDto } from './get-resource.dto';

export class GetPacksDto extends PartialType(GetResourceDto) {}

export class CreatePackDto extends GetResourceDto {
  @ApiProperty({ 
    description: 'Booster pack name',
    example: 'Charizard Pack' 
  })
  @IsString()
  name: string;
}

export class GetPackProbabilitiesDto extends GetResourceDto {
  @ApiProperty({ 
    description: 'Pack ID',
    example: 'charizard' 
  })
  @IsString()
  packId: string;
}

export class GetBestPackDto {
  @ApiProperty({ 
    description: 'Username to calculate best pack for',
    example: 'trainer123' 
  })
  @IsString()
  username: string;
}

export class GetBestPackForExpansionDto extends GetBestPackDto {
  @ApiProperty({ 
    description: 'Specific expansion to analyze',
    example: 'genetic-apex' 
  })
  @IsString()
  expansion: string;
}