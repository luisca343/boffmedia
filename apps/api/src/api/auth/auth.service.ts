import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { TOKEN_TYPE } from '@api/_utils/auth/token-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,

    private readonly usersService: BoffMediaUsersFacadeService,
    private readonly jwtService: JwtService,
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
   */
  async login(fullUser: any, scope?: typeof TOKEN_TYPE.INGAME) {
    const user = fullUser.sessionUser || fullUser;
    // An in-game token proves only a public UUID, so it must never carry admin
    // roles: RolesGuard reads roles straight off the JWT, and a hijacked ingame
    // session belonging to an admin would otherwise reach the admin API. Website
    // (unscoped) sessions keep their real roles.
    const isIngame = scope === TOKEN_TYPE.INGAME;
    const payload = {
      username: user.name,
      sub: user.id,
      email: user.email,
      roles: isIngame ? [] : user.roles,
      mcUuid: user.mcUUid,
    };

    return {
      access_token: this.jwtService.sign(
        scope ? { ...payload, typ: scope } : payload,
      ),
      refresh_token: this.jwtService.sign(
        { ...payload, typ: TOKEN_TYPE.REFRESH, ...(scope ? { scope } : {}) },
        { expiresIn: '7d' },
      ),
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        roles: user.roles,
        mcUuid: user.mcUUid,
        smartRotomUser: user.smartRotomUser || {},
      },
    };
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
          mcUUid: user.boffMediaUser.uuid,
          smartRotomUser: user.smartRotomUser,
        },
      },
      TOKEN_TYPE.INGAME,
    );
  }

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

      const newPayload = {
        username: user.username,
        sub: user.id,
        email: user.email,
        // Ingame sessions never carry roles (see login()); re-minting must not
        // reintroduce them from the DB.
        roles: scope === TOKEN_TYPE.INGAME ? [] : roles,
        mcUuid: user.uuid,
      };

      return {
        access_token: this.jwtService.sign(
          scope ? { ...newPayload, typ: scope } : newPayload,
        ),
        refresh_token: this.jwtService.sign(
          {
            ...newPayload,
            typ: TOKEN_TYPE.REFRESH,
            ...(scope ? { scope } : {}),
          },
          { expiresIn: '7d' },
        ),
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
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async googleLogin(googleUser: any) {
    // Route through createFromGoogle so the google id is captured/synced onto
    // the account (find by google id → by email(attach) → create) — the old
    // findByEmail shortcut never stored googleId and broke new sign-ups.
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
