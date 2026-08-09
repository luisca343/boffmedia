import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

// Linking a Minecraft account by running the Microsoft → Xbox Live → XSTS →
// Minecraft chain, exactly as the launcher does in `src-tauri/src/auth/msa.rs`.
//
// The device-code grant is used rather than an authorization-code redirect for
// one practical reason: it needs no redirect URI registered on the Azure app and
// no client secret, so the website and the launcher share the one approved
// public client that already exists. The user reads a short code off the page
// and approves it at microsoft.com/link.
//
// This replaces the old link paths, which authenticated on the `MC_WORLD`
// string — documented as non-secret and shipped inside the browser bundle, so
// anyone who knew a player's UUID could attach it to their own account.

const DEVICE_CODE_URL =
  'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
const TOKEN_URL =
  'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const XBL_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_LOGIN_URL =
  'https://api.minecraftservices.com/authentication/login_with_xbox';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

const RP_MINECRAFT = 'rp://api.minecraftservices.com/';

/** The same approved public client the launcher uses. Not a secret — a public
 *  client registration has none. */
const CLIENT_ID = '72c3e158-bb47-4ef7-a50c-f3ce51698108';

/** Must be the `consumers` tenant and exactly these scopes. */
const SCOPE = 'XboxLive.signin offline_access';

export interface McDeviceCode {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  intervalSeconds: number;
  deviceCode: string;
}

export interface McProfile {
  uuid: string;
  username: string;
}

export type McPollResult =
  | { status: 'pending' }
  | { status: 'declined' }
  | { status: 'expired' }
  | { status: 'ready'; profile: McProfile };

@Injectable()
export class MinecraftLinkService {
  private readonly logger = new Logger(MinecraftLinkService.name);

  constructor(private readonly http: HttpService) {}

  /** Step 1 — the code the user types at the verification URI. */
  async requestDeviceCode(): Promise<McDeviceCode> {
    const body = new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPE });
    const res = await firstValueFrom(
      this.http.post<{
        user_code: string;
        device_code: string;
        verification_uri: string;
        expires_in: number;
        interval: number;
      }>(DEVICE_CODE_URL, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15_000,
      }),
    );

    return {
      userCode: res.data.user_code,
      deviceCode: res.data.device_code,
      verificationUri: res.data.verification_uri,
      expiresIn: res.data.expires_in,
      intervalSeconds: Math.max(1, res.data.interval),
    };
  }

  /**
   * Step 2 — one non-blocking poll. The browser drives the cadence, so this
   * never sleeps server-side: a request that parked a worker thread for the
   * full ten-minute code lifetime would be trivially DoS-able.
   */
  async poll(deviceCode: string): Promise<McPollResult> {
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: CLIENT_ID,
      device_code: deviceCode,
    });

    const res = await firstValueFrom(
      this.http.post<{
        access_token?: string;
        error?: string;
      }>(TOKEN_URL, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15_000,
        validateStatus: () => true,
      }),
    );

    if (res.status >= 200 && res.status < 300 && res.data.access_token) {
      const profile = await this.resolveProfile(res.data.access_token);
      return { status: 'ready', profile };
    }

    switch (res.data.error) {
      case 'authorization_pending':
      case 'slow_down':
        return { status: 'pending' };
      case 'authorization_declined':
        return { status: 'declined' };
      case 'expired_token':
        return { status: 'expired' };
      default:
        this.logger.error(
          `Microsoft device token error: ${JSON.stringify(res.data)}`,
        );
        throw new BadRequestException(
          'Microsoft rechazó la autorización. Inténtalo de nuevo.',
        );
    }
  }

  /** Steps 3–6 — everything downstream of a Microsoft access token. */
  private async resolveProfile(msAccessToken: string): Promise<McProfile> {
    // The `d=` prefix is MANDATORY for tokens from an Azure app registration.
    // Omitting it is the single most common mistake in this chain and fails
    // with an opaque Xbox error.
    const xbl = await firstValueFrom(
      this.http.post<{
        Token: string;
        DisplayClaims: { xui: { uhs?: string }[] };
      }>(
        XBL_URL,
        {
          Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: `d=${msAccessToken}`,
          },
          RelyingParty: 'http://auth.xboxlive.com',
          TokenType: 'JWT',
        },
        { timeout: 20_000 },
      ),
    );

    const uhs = xbl.data.DisplayClaims?.xui?.[0]?.uhs;
    if (!uhs) {
      throw new BadRequestException('Xbox no devolvió una sesión utilizable');
    }

    const xsts = await firstValueFrom(
      this.http.post<{ Token: string; XErr?: number }>(
        XSTS_URL,
        {
          Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.data.Token] },
          RelyingParty: RP_MINECRAFT,
          TokenType: 'JWT',
        },
        { timeout: 20_000, validateStatus: () => true },
      ),
    );

    if (xsts.status === 401) {
      throw new BadRequestException(this.describeXErr(xsts.data?.XErr));
    }
    if (xsts.status < 200 || xsts.status >= 300) {
      throw new BadRequestException('Xbox rechazó la sesión.');
    }

    // Literal `XBL3.0 x=`, user hash, semicolon, XSTS token.
    const mc = await firstValueFrom(
      this.http.post<{ access_token: string }>(
        MC_LOGIN_URL,
        { identityToken: `XBL3.0 x=${uhs};${xsts.data.Token}` },
        { timeout: 20_000, validateStatus: () => true },
      ),
    );

    if (mc.status === 429) {
      throw new BadRequestException(
        'Minecraft está limitando las peticiones de tu cuenta. Espera un minuto y vuelve a intentarlo.',
      );
    }
    if (mc.status < 200 || mc.status >= 300 || !mc.data?.access_token) {
      throw new BadRequestException('Minecraft rechazó la sesión.');
    }
    // TRAP: this response also carries a `username` field, and it is an internal
    // account id, NOT the Minecraft username. The real name only comes from the
    // profile call below.

    const profile = await firstValueFrom(
      this.http.get<{ id: string; name: string }>(MC_PROFILE_URL, {
        headers: { Authorization: `Bearer ${mc.data.access_token}` },
        timeout: 20_000,
        validateStatus: () => true,
      }),
    );

    if (profile.status === 404) {
      throw new BadRequestException(
        'Esta cuenta no tiene un perfil de Minecraft: Java Edition. O no posee el juego, o es una cuenta de Game Pass que todavía no ha elegido nombre en el launcher oficial.',
      );
    }
    if (profile.status < 200 || profile.status >= 300 || !profile.data?.id) {
      throw new UnauthorizedException('No se pudo leer el perfil de Minecraft');
    }

    return {
      uuid: this.dashUuid(profile.data.id),
      username: profile.data.name,
    };
  }

  /** A raw XErr is useless to a player; these are the five that actually happen. */
  private describeXErr(xerr?: number): string {
    switch (xerr) {
      case 2148916227:
        return 'Esta cuenta está bloqueada en los servicios de Xbox.';
      case 2148916233:
        return 'Esta cuenta no tiene perfil de Xbox. Crea uno en xbox.com y vuelve a intentarlo.';
      case 2148916235:
        return 'Los servicios de Xbox no están disponibles en esta región.';
      case 2148916236:
      case 2148916237:
        return 'Esta cuenta necesita verificación de adulto para usar los servicios de Xbox.';
      case 2148916238:
        return 'Esta cuenta es de un menor y debe añadirse a un grupo Microsoft Family.';
      default:
        return xerr
          ? `Xbox rechazó la sesión (XErr ${xerr}).`
          : 'Xbox rechazó la sesión.';
    }
  }

  /** Mojang returns 32-hex with no dashes; `rotom_users.uuid` is char(36) dashed,
   *  and a mismatch makes every downstream lookup silently miss. */
  private dashUuid(raw: string): string {
    if (raw.includes('-')) return raw.toLowerCase();
    const h = raw.toLowerCase();
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
}
