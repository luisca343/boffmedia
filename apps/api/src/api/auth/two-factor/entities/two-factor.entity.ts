import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorEnrolmentEntity {
  @ApiProperty({
    example: 'JBSWY3DPEHPK3PXP',
    description:
      'Base32 shared secret, for typing in when the QR cannot be scanned',
  })
  secret: string;

  @ApiProperty({
    example:
      'otpauth://totp/Boffmedia:admin?secret=JBSWY3DPEHPK3PXP&issuer=Boffmedia',
    description: 'RFC 6238 / Key Uri Format provisioning URI',
  })
  otpauth_url: string;

  @ApiProperty({
    description:
      'The provisioning URI as an inline SVG, so clients need no QR library',
  })
  qr_svg: string;
}

export class TwoFactorBackupCodesEntity {
  @ApiProperty({
    type: String,
    isArray: true,
    description:
      'Single-use codes, shown ONCE. Only their hashes are stored, so they cannot be re-read later.',
  })
  backup_codes: string[];
}

export class TwoFactorStatusEntity {
  @ApiProperty({
    description: 'Whether this account holds a role that requires 2FA',
  })
  required: boolean;

  @ApiProperty({ description: 'Whether a confirmed second factor exists' })
  enrolled: boolean;

  @ApiProperty({ description: 'Backup codes not yet spent' })
  backup_codes_remaining: number;
}

export class TwoFactorStepUpEntity {
  @ApiProperty({
    description:
      'Short-lived token to send as the X-Step-Up-Token header on a sensitive action',
  })
  step_up_token: string;

  @ApiProperty({ example: 300, description: 'Lifetime in seconds' })
  expires_in: number;
}
