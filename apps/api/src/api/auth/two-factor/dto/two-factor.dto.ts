import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/** A code from the authenticator app. Six digits, always. */
export class TwoFactorConfirmDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;
}

/**
 * Either half of the factor. The service refuses a request that carries neither
 * — validating "exactly one of these" here would need a custom validator for no
 * gain, and the failure mode is the same generic invalid-code answer.
 */
export class TwoFactorVerifyDto {
  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code?: string;

  @ApiPropertyOptional({
    example: 'K7M2P9QRTV',
    description: 'Single-use backup code, if the authenticator is unavailable',
  })
  @IsOptional()
  @IsString()
  // Long enough for the grouped presentations people paste back in, short
  // enough that nothing large reaches the hash.
  @Length(8, 32)
  backupCode?: string;
}
