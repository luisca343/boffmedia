import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayMaxSize,
} from 'class-validator';

/**
 * What the admin picked on the sync screen. Every data type is independent: an
 * admin refreshing card text after a balance patch should not re-download a
 * gigabyte of artwork, and someone adding a brand new expansion should not have
 * to re-walk the sets that are already complete.
 */
export class TcgSyncRequestDto {
  @ApiPropertyOptional({ description: 'Series to sync', default: 'tcgp' })
  @IsOptional()
  @IsString()
  seriesId?: string;

  @ApiPropertyOptional({ description: 'Sync the series list itself' })
  @IsOptional()
  @IsBoolean()
  series?: boolean;

  @ApiPropertyOptional({ description: 'Sync the set/expansion catalogue' })
  @IsOptional()
  @IsBoolean()
  sets?: boolean;

  @ApiPropertyOptional({ description: 'Sync card data for the selected sets' })
  @IsOptional()
  @IsBoolean()
  cards?: boolean;

  @ApiPropertyOptional({
    description: 'Download card artwork for the selected sets',
  })
  @IsOptional()
  @IsBoolean()
  images?: boolean;

  @ApiPropertyOptional({
    description:
      'Sets to process. Omit or leave empty to process every set in the series.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  setIds?: string[];

  @ApiPropertyOptional({
    description:
      'Re-fetch sets that are already complete. Off by default, so a re-run ' +
      'only fills the gaps and finishes in seconds.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class TcgSyncSetStatus {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Set exists in the database' }) inDb: boolean;
  @ApiProperty({ description: 'Cards the remote catalogue reports' })
  cardsRemote: number;
  @ApiProperty({ description: 'Cards stored locally' }) cardsInDb: number;
  @ApiProperty({ description: 'Stored EN artwork files' }) imagesEn: number;
  @ApiProperty({ description: 'Stored ES artwork files' }) imagesEs: number;
  @ApiProperty({
    description: 'Cards with artwork in at least one locale',
  })
  imagesAny: number;
  @ApiProperty({
    description:
      'Cards with no artwork at all. One locale missing upstream is normal, ' +
      'so a card counts as covered once either locale is stored.',
  })
  imagesMissing: number;
  @ApiProperty({
    enum: ['missing', 'cards-partial', 'images-partial', 'ok'],
    description: 'What this set still needs',
  })
  state: TcgSyncSetState;
}

export type TcgSyncSetState =
  | 'missing'
  | 'cards-partial'
  | 'images-partial'
  | 'ok';

export class TcgSyncStatus {
  @ApiProperty() seriesId: string;
  @ApiProperty({ description: 'Remote catalogue was reachable' })
  remoteAvailable: boolean;
  @ApiPropertyOptional({ description: 'Why the remote check failed, if it did' })
  remoteError?: string | null;
  @ApiProperty() setsRemote: number;
  @ApiProperty() setsInDb: number;
  @ApiProperty() cardsRemote: number;
  @ApiProperty() cardsInDb: number;
  @ApiProperty({ description: 'Cards that have artwork' })
  imagesPresent: number;
  @ApiProperty({ description: 'Cards stored, i.e. cards that want artwork' })
  imagesExpected: number;
  @ApiProperty({ type: [TcgSyncSetStatus] }) sets: TcgSyncSetStatus[];
}
