import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  CurrentUser,
  AuthPrincipal,
} from '@api/_utils/decorators/current-user.decorator';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { TOKEN_TYPE } from '@api/_utils/auth/token-types';
import { holdsAdminRole } from '@api/_utils/auth/roles.constants';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { AuthService, type AuthSessionResult } from '../auth.service';
import { AuthLoginResponseEntity } from '../entities/auth-response.entity';
import { MfaChallengeGuard, type MfaChallengeRequest } from './mfa-challenge.guard';
import { MfaChallengeThrottlerGuard } from './mfa-challenge-throttler.guard';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorConfirmDto, TwoFactorVerifyDto } from './dto/two-factor.dto';
import {
  TwoFactorBackupCodesEntity,
  TwoFactorEnrolmentEntity,
  TwoFactorStatusEntity,
  TwoFactorStepUpEntity,
} from './entities/two-factor.entity';

/** A step-up is meant to say "the person is at the keyboard RIGHT NOW". Five
 *  minutes covers an upload-then-publish pair without covering a coffee break. */
const STEP_UP_TTL_SECONDS = 300;

/**
 * The second-factor surface, in two halves that never share a credential:
 *
 *  - `/auth/2fa/challenge/*` — mid-sign-in. Authenticated by the `typ:'mfa'`
 *    challenge token from `/auth/login`, which grants nothing else. This is
 *    where enrolment happens, because an admin cannot HAVE a session before
 *    enrolling: `AuthService.login()` never mints one for them.
 *  - the rest — already signed in. Ordinary session auth.
 *
 * `@Public()` on the challenge routes is the same exception `/auth/login` makes:
 * the global JwtAuthGuard would reject the challenge token (it is not a website
 * token type) before MfaChallengeGuard ever saw it.
 */
@ApiTags('BoffMedia | Two-factor')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(
    private readonly twoFactor: TwoFactorService,
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  // ==================== MID-SIGN-IN (challenge token) ====================

  @Public()
  @Post('challenge/enroll/start')
  @UseGuards(MfaChallengeGuard, MfaChallengeThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Empezar la inscripción en la verificación en dos pasos',
    description:
      'Devuelve un secreto nuevo en estado pendiente. No sustituye a un segundo factor ya confirmado: para eso hay que regenerarlo desde la sesión.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TwoFactorEnrolmentEntity })
  async startEnrolment(@Req() req: MfaChallengeRequest) {
    const principal = req.mfaChallenge!;
    return this.twoFactor.startEnrolment(principal.userId, principal.username);
  }

  @Public()
  @Post('challenge/enroll/confirm')
  @UseGuards(MfaChallengeGuard, MfaChallengeThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Confirmar la inscripción y entrar',
    description:
      'Los códigos de recuperación se muestran una sola vez: en la base de datos solo queda su hash.',
  })
  async confirmEnrolment(
    @Req() req: MfaChallengeRequest,
    @Body() dto: TwoFactorConfirmDto,
  ): Promise<AuthSessionResult & TwoFactorBackupCodesEntity> {
    const { userId } = req.mfaChallenge!;
    const backupCodes = await this.twoFactor.confirmEnrolment(userId, dto.code);
    // Signing in as part of confirming is deliberate: the alternative is asking
    // for a second code ten seconds after the first one proved the same secret.
    const session = await this.auth.issueSessionForVerifiedUser(userId);
    return { ...session, backup_codes: backupCodes };
  }

  @Public()
  @Post('challenge/verify')
  @UseGuards(MfaChallengeGuard, MfaChallengeThrottlerGuard)
  // Ten a minute per account: enough for a fat-fingered code twice, far short of
  // brute-forcing six digits (a million combinations).
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Completar el inicio de sesión con el segundo factor' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthLoginResponseEntity })
  async verify(
    @Req() req: MfaChallengeRequest,
    @Body() dto: TwoFactorVerifyDto,
  ): Promise<AuthSessionResult> {
    const { userId } = req.mfaChallenge!;
    assertHasFactor(dto);
    await this.twoFactor.assertSecondFactor(userId, dto);
    return this.auth.issueSessionForVerifiedUser(userId);
  }

  // ==================== SIGNED IN ====================

  @Get('status')
  @UseGuards(JwtAuthGuard, FullSessionGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Estado de la verificación en dos pasos de mi cuenta' })
  @ApiResponse({ status: HttpStatus.OK, type: TwoFactorStatusEntity })
  async status(
    @CurrentUser() user: AuthPrincipal,
  ): Promise<TwoFactorStatusEntity> {
    return {
      required: holdsAdminRole(user.roles),
      enrolled: await this.twoFactor.isEnrolled(user.userId),
      backup_codes_remaining: await this.twoFactor.remainingBackupCodes(
        user.userId,
      ),
    };
  }

  @Post('backup-codes')
  @UseGuards(JwtAuthGuard, FullSessionGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Regenerar los códigos de recuperación',
    description:
      'Requiere un código válido: regenerar invalida los anteriores, así que una sesión secuestrada no puede dejar al dueño sin vía de vuelta.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TwoFactorBackupCodesEntity })
  async regenerateBackupCodes(
    @CurrentUser() user: AuthPrincipal,
    @Body() dto: TwoFactorVerifyDto,
  ): Promise<TwoFactorBackupCodesEntity> {
    assertHasFactor(dto);
    await this.twoFactor.assertSecondFactor(user.userId, dto);
    return {
      backup_codes: await this.twoFactor.regenerateBackupCodes(user.userId),
    };
  }

  @Post('step-up')
  @UseGuards(JwtAuthGuard, FullSessionGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Obtener una confirmación reciente para una acción sensible',
    description:
      'El token resultante viaja en la cabecera X-Step-Up-Token de publicar una release o una versión de pack.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TwoFactorStepUpEntity })
  async stepUp(
    @CurrentUser() user: AuthPrincipal,
    @Body() dto: TwoFactorVerifyDto,
  ): Promise<TwoFactorStepUpEntity> {
    assertHasFactor(dto);
    await this.twoFactor.assertSecondFactor(user.userId, dto);
    return {
      step_up_token: this.jwt.sign(
        { sub: user.userId, typ: TOKEN_TYPE.MFA, su: true },
        { expiresIn: STEP_UP_TTL_SECONDS },
      ),
      expires_in: STEP_UP_TTL_SECONDS,
    };
  }
}

/** Both fields are optional so either half of the factor can be sent; a request
 *  with neither is a client bug, not a wrong code, and saying so keeps it out of
 *  the "invalid code" rate limit that protects the real check. */
function assertHasFactor(dto: TwoFactorVerifyDto): void {
  if (!dto.code && !dto.backupCode) {
    throw new BadRequestException(
      userError(
        ApiErrorCode.AUTH_TWO_FACTOR_REQUIRED,
        'a code or a backup code is required',
      ),
    );
  }
}
