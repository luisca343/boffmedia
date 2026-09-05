import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { TOKEN_TYPE } from '@api/_utils/auth/token-types';
import { holdsAdminRole } from '@api/_utils/auth/roles.constants';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { TwoFactorRepository } from './two-factor/two-factor.repository';

/** Refresh-token life. Unchanged by rotation: what changed is that a token now
 *  dies the moment it is exchanged, so the seven days are a ceiling on an
 *  IDLE session rather than a stolen credential's guaranteed lifetime. */
const REFRESH_TTL_DAYS = 7;
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * How long after a token was legitimately exchanged a SECOND presentation of it
 * is still forgiven.
 *
 * This is not politeness, it is a correctness requirement. NextAuth runs its
 * `jwt` callback per request, so two page loads landing in the same millisecond
 * both read the same stored refresh token and both post it. Without a grace
 * window one of them is indistinguishable from theft, and the honest user is
 * signed out of a family they own — a self-inflicted denial of service that
 * would fire far more often than a real attack.
 *
 * Thirty seconds is bounded by what a client can plausibly have in flight; a
 * replay outside it is still treated as theft, so the detection this exists to
 * protect is only blunted for the half-minute after a legitimate refresh.
 */
const REFRESH_ROTATION_GRACE_MS = 30_000;

/** The two-factor challenge is a hand-off between two requests the user makes
 *  back to back. Ten minutes covers finding a phone; it is not a session. */
const MFA_CHALLENGE_TTL = '10m';

/** The session shape `/auth/login` and `/auth/2fa/verify` both answer with. */
export interface AuthSessionResult {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    roles: string[];
    mcUuid: string | null;
    smartRotomUser: unknown;
  };
}

/**
 * What an admin account gets instead of a session. Carries no account powers:
 * the challenge token is `typ:'mfa'`, which is not in WEBSITE_TOKEN_TYPES and
 * therefore authenticates nothing but `/auth/2fa/*`.
 */
export interface AuthTwoFactorChallengeResult {
  two_factor: {
    required: true;
    /** false = the account must be walked through enrolment before it can sign
     *  in at all. Admin 2FA is mandatory, so this is a step, not an offer. */
    enrolled: boolean;
    challenge_token: string;
  };
}

export type AuthLoginResult = AuthSessionResult | AuthTwoFactorChallengeResult;

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,

    private readonly usersService: BoffMediaUsersFacadeService,
    private readonly usersRepository: BoffMediaUsersRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokens: RefreshTokensRepository,
    // The REPOSITORY, not TwoFactorService: the service needs to mint sessions
    // once a code checks out, so depending on it here would close a cycle.
    private readonly twoFactor: TwoFactorRepository,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(username, password);
    if (user) {
      return user;
    }
    return null;
  }

  /**
   * `scope` narrows what the minted session may do. Undefined = a full website
   * session; `ingame` = the MCEF session from the Mojang handshake, which
   * proves a Minecraft identity but not account ownership and is therefore
   * refused by FullSessionGuard. The
   * refresh token carries the scope forward so refreshing can never widen it.
   *
   * An account holding an admin role does NOT get a session here — it gets a
   * two-factor challenge. That gate is on this method rather than on the
   * controller so it covers the OAuth callbacks too: signing in through Google
   * or Discord reaches an admin account by exactly the same door.
   */
  async login(
    fullUser: any,
    scope?: typeof TOKEN_TYPE.INGAME,
  ): Promise<AuthLoginResult> {
    const user = fullUser.sessionUser || fullUser;

    // In-game sessions are exempt: they carry no roles at all (see below), so
    // there is no admin power behind them to protect — and there is no way to
    // type a six-digit code inside the MCEF webview mid-handshake.
    if (!scope && holdsAdminRole(user.roles)) {
      return {
        two_factor: {
          required: true,
          enrolled: await this.twoFactor.isEnrolled(user.id),
          challenge_token: this.jwtService.sign(
            { sub: user.id, username: user.name, typ: TOKEN_TYPE.MFA },
            { expiresIn: MFA_CHALLENGE_TTL },
          ),
        },
      };
    }

    return this.mintSession(fullUser, scope);
  }

  /**
   * Mint a session for an account whose second factor has just been verified.
   * Deliberately bypasses the gate in `login()` — re-running it here would ask
   * for the code that was just given.
   */
  async issueSessionForVerifiedUser(
    userId: number,
  ): Promise<AuthSessionResult> {
    const withIntegrations = await this.usersService.getUserWithIntegrations(
      String(userId),
      'id',
    );
    if (!withIntegrations) {
      throw new UnauthorizedException('User not found');
    }
    const { boffMediaUser, roles, smartRotomUser } = withIntegrations;
    return this.mintSession({
      sessionUser: {
        id: boffMediaUser.id,
        name: boffMediaUser.username,
        email: boffMediaUser.email,
        roles,
        mcUuid: boffMediaUser.uuid,
        smartRotomUser,
      },
    });
  }

  private async mintSession(
    fullUser: any,
    scope?: typeof TOKEN_TYPE.INGAME,
  ): Promise<AuthSessionResult> {
    const user = fullUser.sessionUser || fullUser;
    // An in-game token proves only a public UUID, so it must never carry admin
    // roles: RolesGuard reads roles straight off the JWT, and a hijacked ingame
    // session belonging to an admin would otherwise reach the admin API. Website
    // (unscoped) sessions keep their real roles.
    const isIngame = scope === TOKEN_TYPE.INGAME;

    // Fetch the current session version for website sessions. In-game sessions
    // do not use session version — they prove only a Minecraft identity, not
    // account ownership.
    let sessionVersion: number | undefined;
    if (!isIngame) {
      sessionVersion =
        (await this.usersRepository.getSessionVersion(user.id)) ?? 0;
    }

    const payload = {
      username: user.name,
      sub: user.id,
      email: user.email,
      roles: isIngame ? [] : user.roles,
      mcUuid: user.mcUuid,
      ...(sessionVersion !== undefined ? { sv: sessionVersion } : {}),
    };

    return {
      access_token: this.jwtService.sign(
        scope ? { ...payload, typ: scope } : payload,
      ),
      // A new sign-in starts a new FAMILY: the rotation chain is scoped to one
      // device's session, so a theft on one machine never signs the account out
      // of the others.
      refresh_token: await this.mintRefreshToken(payload, {
        userId: user.id,
        scope,
      }),
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        roles: user.roles,
        mcUuid: user.mcUuid,
        smartRotomUser: user.smartRotomUser || {},
      },
    };
  }

  /**
   * Sign a refresh token AND record the jti that makes it single-use.
   *
   * The row is written before the token is handed out, never after: a token in
   * a client's hands with no ledger row would be refused at the next refresh,
   * which reads to the user as a random logout.
   */
  private async mintRefreshToken(
    payload: Record<string, unknown>,
    opts: {
      userId: number;
      scope?: typeof TOKEN_TYPE.INGAME;
      /** Continue an existing rotation chain. Omitted = start a new one. */
      familyId?: string;
    },
  ): Promise<string> {
    const jti = randomUUID();
    const familyId = opts.familyId ?? randomUUID();
    await this.refreshTokens.issue({
      jti,
      familyId,
      userId: opts.userId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });

    return this.jwtService.sign(
      {
        ...payload,
        typ: TOKEN_TYPE.REFRESH,
        ...(opts.scope ? { scope: opts.scope } : {}),
        jti,
        fam: familyId,
      },
      { expiresIn: `${REFRESH_TTL_DAYS}d` },
    );
  }

  /**
   * Mint an in-game session for a Minecraft identity that has already been
   * PROVED via Mojang's hasJoined handshake. Scoped to `ingame`: proving a
   * Minecraft identity is not the same as signing in to the website, and the
   * MCEF page only ever needs the Rotom-phone surface.
   *
   * This is now the ONLY way to obtain an in-game session. It replaced
   * `loginmc`, which authenticated on the non-secret `MC_WORLD` string, and
   * `registerMinecraft` / `linkMinecraft` before it; linking happens on the
   * website through Microsoft (MinecraftLinkService), so there is nothing left
   * here to auto-provision credentials for.
   */
  async loginProvenMinecraft(uuid: string) {
    const user = await this.usersService.getUserWithIntegrations(uuid, 'uuid');
    if (!user) {
      return { error: 'User not found in BoffMedia system' };
    }

    return this.login(
      {
        sessionUser: {
          id: user.boffMediaUser.id,
          name: user.boffMediaUser.username,
          email: user.boffMediaUser.email,
          roles: user.roles,
          mcUuid: user.boffMediaUser.uuid,
          smartRotomUser: user.smartRotomUser,
        },
      },
      TOKEN_TYPE.INGAME,
    );
  }

  /**
   * Exchange a refresh token for a new pair — and burn the one presented.
   *
   * Three things happen here that did not before rotation shipped:
   *
   *  1. the presented jti is CLAIMED (`rotated_at`), so it can never be spent
   *     twice, no matter how the two requests interleave;
   *  2. a second presentation of an already-claimed jti REVOKES THE WHOLE
   *     FAMILY. That is the only observable signature of a stolen refresh
   *     token: the thief and the owner both hold the same token, and whoever
   *     refreshes second presents one that is already spent. Revoking the
   *     family throws them both out, which is the correct outcome — the account
   *     owner re-authenticates, the thief cannot;
   *  3. the family stays scoped to one sign-in, so this never touches sessions
   *     on the user's other devices. A global `sessionVersion` bump would, and
   *     a single false positive would then sign the user out everywhere.
   */
  async refreshToken(tokenData: any) {
    try {
      if (typeof tokenData !== 'string') {
        throw new UnauthorizedException('Invalid token format');
      }

      let payload;
      try {
        payload = this.jwtService.verify(tokenData);
      } catch {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Refresh tokens carry `typ: 'refresh'`; access tokens carry no `typ` at
      // all. Accepting typ-less tokens meant every access token could be
      // replayed at /auth/refresh — the migration window is closed, so only a
      // real `typ:'refresh'` token is accepted now.
      const ALLOW_LEGACY_REFRESH = false;
      const isRefresh = payload.typ === TOKEN_TYPE.REFRESH;
      const isLegacy = payload.typ === undefined && ALLOW_LEGACY_REFRESH;
      if (!isRefresh && !isLegacy) {
        throw new UnauthorizedException('Not a refresh token');
      }

      const userId = Number(payload.sub || payload.id);
      const familyId = await this.rotateOrDetectReuse(payload, userId);

      // Fetch full user with integrations so smartRotomUser comes from DB,
      // not from the JWT payload (where it was never encoded).
      const userWithIntegrations =
        await this.usersService.getUserWithIntegrations(
          (payload.sub || payload.id).toString(),
          'id',
        );

      if (!userWithIntegrations) {
        throw new UnauthorizedException('User not found');
      }

      const {
        boffMediaUser: user,
        roles,
        smartRotomUser,
      } = userWithIntegrations;

      // A narrowed session stays narrowed across refreshes — otherwise an
      // in-game token buys a full website session one round trip later.
      const scope: typeof TOKEN_TYPE.INGAME | undefined =
        payload.scope === TOKEN_TYPE.INGAME ? TOKEN_TYPE.INGAME : undefined;

      // An account can GAIN an admin role while holding a session minted before
      // it: the refresh token itself is proof of whatever gate applied at
      // sign-in, and that gate did not include 2FA yet. Refusing here sends them
      // back through /auth/login, which walks them into enrolment. Ingame
      // sessions are exempt for the same reason as in login(): they carry no
      // roles at all.
      if (
        !scope &&
        holdsAdminRole(roles) &&
        !(await this.twoFactor.isEnrolled(user.id))
      ) {
        throw new UnauthorizedException(
          userError(
            ApiErrorCode.AUTH_TWO_FACTOR_ENROLMENT_REQUIRED,
            'admin account has no second factor enrolled',
          ),
        );
      }

      // For website sessions, fetch the current session version. In-game sessions
      // are narrowed and do not use session version — they prove only Minecraft
      // identity, not account ownership.
      let sessionVersion: number | undefined;
      if (!scope) {
        sessionVersion =
          (await this.usersRepository.getSessionVersion(user.id)) ?? 0;
      }

      const newPayload = {
        username: user.username,
        sub: user.id,
        email: user.email,
        // Ingame sessions never carry roles (see login()); re-minting must not
        // reintroduce them from the DB.
        roles: scope === TOKEN_TYPE.INGAME ? [] : roles,
        mcUuid: user.uuid,
        ...(sessionVersion !== undefined ? { sv: sessionVersion } : {}),
      };

      return {
        access_token: this.jwtService.sign(
          scope ? { ...newPayload, typ: scope } : newPayload,
        ),
        refresh_token: await this.mintRefreshToken(newPayload, {
          userId: user.id,
          scope,
          familyId,
        }),
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          roles,
          image: user.profilePicture || null,
          smartRotomUser: smartRotomUser
            ? {
                username: smartRotomUser.username,
                uuid: smartRotomUser.uuid,
                world: smartRotomUser.world || '',
              }
            : null,
        },
      };
    } catch (error: any) {
      this.logger.error('Refresh token error:', error);
      // A reuse detection has to survive this catch with its code intact: it is
      // the one refresh failure the client must treat as "sign out", not as
      // "retry later". Collapsing it into the generic 401 below would hide the
      // single most important signal this method produces.
      const passThrough: string[] = [
        ApiErrorCode.AUTH_REFRESH_REUSE_DETECTED,
        ApiErrorCode.AUTH_TWO_FACTOR_ENROLMENT_REQUIRED,
      ];
      if (passThrough.includes(error?.response?.code)) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Spend the presented jti, or recognise that it has already been spent.
   *
   * @returns the family the replacement token must join.
   */
  private async rotateOrDetectReuse(
    payload: { jti?: string; fam?: string },
    userId: number,
  ): Promise<string | undefined> {
    // Tokens minted before rotation shipped carry no jti. They are accepted
    // once and answered with a rotating one, so a live session upgrades on its
    // next refresh instead of being signed out by a deploy. Every such token has
    // expired seven days after the rollout — flip this to false then, exactly
    // like ALLOW_LEGACY_REFRESH above.
    const ALLOW_PRE_ROTATION_REFRESH = true;
    if (!payload.jti) {
      if (ALLOW_PRE_ROTATION_REFRESH) return undefined;
      throw new UnauthorizedException(
        userError(
          ApiErrorCode.AUTH_REFRESH_INVALID,
          'refresh token has no jti',
        ),
      );
    }

    const row = await this.refreshTokens.findByJti(payload.jti);
    if (!row || row.userId !== userId) {
      // Signed by us but absent from the ledger: either the family was pruned
      // after expiry or the claim is forged. Neither is refreshable.
      throw new UnauthorizedException(
        userError(ApiErrorCode.AUTH_REFRESH_INVALID, 'unknown refresh token'),
      );
    }

    if (row.revokedAt) {
      throw new UnauthorizedException(
        userError(
          ApiErrorCode.AUTH_REFRESH_REUSE_DETECTED,
          'refresh token family was revoked',
        ),
      );
    }

    const now = new Date();
    if (await this.refreshTokens.claimRotation(payload.jti, now)) {
      return row.familyId;
    }

    // Already spent. Inside the grace window this is two of the client's own
    // requests racing (see REFRESH_ROTATION_GRACE_MS); outside it, the same
    // token has been presented long after it was exchanged, which only happens
    // if a copy of it exists somewhere it should not.
    const spentAgoMs = now.getTime() - (row.rotatedAt?.getTime() ?? 0);
    if (row.rotatedAt && spentAgoMs <= REFRESH_ROTATION_GRACE_MS) {
      return row.familyId;
    }

    await this.refreshTokens.revokeFamily(row.familyId, now);
    this.logger.warn(
      `Refresh token reuse detected for user ${userId}; revoked family ${row.familyId}`,
    );
    throw new UnauthorizedException(
      userError(
        ApiErrorCode.AUTH_REFRESH_REUSE_DETECTED,
        'refresh token was already rotated',
      ),
    );
  }

  async googleLogin(googleUser: any) {
    // Route through createFromGoogle so the google id is captured/synced onto
    // the account (find by google id → by email(attach) → create). A bare
    // findByEmail shortcut never stores googleId and breaks new sign-ups.
    const user = await this.usersService.createFromGoogle(googleUser);
    return this.login(user);
  }

  async discordLogin(discordUser: {
    discordId: string;
    email?: string;
    name?: string;
    picture?: string;
  }) {
    // createFromDiscord resolves the account internally (by discordId, then by
    // email, else create) and returns the session user — mirrors the Google path.
    const user = await this.usersService.createFromDiscord({
      discordId: discordUser.discordId,
      email: discordUser.email,
      name: discordUser.name,
      profilePicture: discordUser.picture,
    });

    return this.login(user);
  }

  async twitchLogin(twitchUser: {
    twitchId: string;
    email?: string;
    name?: string;
    picture?: string;
  }) {
    // createFromTwitch resolves the account internally (by twitchId, then by
    // email, else create) and returns the session user — mirrors Discord.
    const user = await this.usersService.createFromTwitch({
      twitchId: twitchUser.twitchId,
      email: twitchUser.email,
      name: twitchUser.name,
      profilePicture: twitchUser.picture,
    });

    return this.login(user);
  }
}
