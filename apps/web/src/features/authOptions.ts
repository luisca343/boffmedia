import { NextAuthOptions } from "next-auth";
import { ApiErrorCode } from "@boffmedia/shared/error-codes";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import DiscordProvider, { DiscordProfile } from "next-auth/providers/discord";
import TwitchProvider, { TwitchProfile } from "next-auth/providers/twitch";
import { env } from "@/config/env";
import { boffPOST } from '@/services/boffAPI';
import { BoffUser } from "@/types";
import type { UserRole } from "@boffmedia/shared/roles";
import { AuthError, AUTH_ERROR_CODES, handleAuthError } from '@/utils/auth-errors';
import { CookiesOptions } from "next-auth";
import type { AuthLoginResponseEntity, AuthRefreshResponseEntity } from "@boffmedia/shared";

// Discord OAuth only activates when both credentials are configured — keeps the
// provider (and the /entrar button) inert until the app secrets are set.
export const discordEnabled = Boolean(
  env.DISCORD_ID && env.DISCORD_SECRET,
);

// Twitch OAuth only activates when both credentials are configured — keeps the
// provider (and the /entrar button) inert until the app secrets are set.
export const twitchEnabled = Boolean(
  env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET,
);

// The session cookie is pinned to a parent domain so the app and its subdomains
// share one login. That pinning cannot hold on a plain-HTTP local host: the
// `__Secure-` prefix and `secure: true` both require HTTPS, and a `.ficuslab.es`
// domain never matches `localhost` — so the browser drops the Set-Cookie without
// a word and every request afterwards comes back signed out.
//
// NODE_ENV cannot make this call. The deployed dev box at ficuslab.es also runs
// with NODE_ENV !== 'production' — that is precisely why the branch below hands
// it `.ficuslab.es`. The app's own public origin can: https means a real
// deployment, http:// means someone is running it on their machine.
//
// Fail-closed: an unset/blank URL does NOT start with `http://`, so it keeps the
// hardened cookie rather than silently downgrading a misconfigured deployment.
const appUrl = process.env.NEXTAUTH_URL || env.NEXT_PUBLIC_URL;
const isPlainHttpHost = appUrl.startsWith('http://');

const sessionCookie = {
  sessionToken: isPlainHttpHost
    ? {
        name: 'next-auth.session-token',
        options: {
          httpOnly: true,
          // No `domain` key — host-only, so it binds to whatever host and port
          // the dev server happens to be on.
          sameSite: 'lax',
          path: '/',
          secure: false,
        },
      }
    : {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'none',
          path: '/',
          secure: true,
          domain: env.NODE_ENV === 'production' ? '.boffmedia.es' : '.ficuslab.es',
        },
      },
} as Partial<CookiesOptions>;

export const authOptions: NextAuthOptions = {
  // `/entrar` is the ONLY login entry point. These two used to point at
  // `/auth/signin` and `/auth/error`, neither of which is a route — so every
  // NextAuth-driven sign-in redirect and every provider error landed on a 404.
  // Errors arrive as `?error=<code>`; AuthScreen surfaces them as a toast.
  /*
    pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  */
  pages: {
    signIn: '/entrar',
    error: '/entrar',
  },
  providers: [
    CredentialsProvider({
      id: "boffmedia",
      name: "BoffMedia",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          const envelope = await boffPOST<AuthLoginResponseEntity | { error: string }>(`/auth/login`, {
            username: credentials.username,
            password: credentials.password,
          });

          // `null` from authorize() means exactly one thing to NextAuth: these
          // credentials are wrong. The API answers 503 when it could not reach
          // the database and therefore never checked them — collapsing that into
          // `null` is what made an outage read as a wrong password all the way
          // to the login form. Rethrown so the form can say something true.
          if (envelope.statusCode === 503 || envelope.code === ApiErrorCode.SERVICE_DATABASE_UNAVAILABLE) {
            throw new Error(ApiErrorCode.SERVICE_DATABASE_UNAVAILABLE);
          }

          const response = envelope.data;

          if (response && !('error' in response)) {
            const { user } = response;
            return {
              ...user,
              id: String(user.id),
              roles: user.roles as UserRole[],
              mcUuid: user.mcUuid ?? undefined,
              smartRotomUser: user.smartRotomUser ?? undefined,
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
            };
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          // Everything else stays `null` (= bad credentials); only the
          // "never checked" signal is allowed past.
          if (error instanceof Error && error.message === ApiErrorCode.SERVICE_DATABASE_UNAVAILABLE) throw error;
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: "minecraft",
      name: "Minecraft",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Luisca" },
        uuid: { label: "UUID", type: "text" },
        world: { label: "World", type: "text" },
        // The proven path. Present when the mod completed Mojang's
        // session/minecraft/join against a serverId this API issued.
        serverId: { label: "Server ID", type: "text" }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.username || !credentials?.uuid || !credentials?.world) {
            throw new AuthError("Missing required Minecraft credentials", AUTH_ERROR_CODES.MISSING_CREDENTIALS);
          }
          // `serverId` is the credential, and the only one: the mod joins
          // Mojang with the running game's own access token and the API confirms
          // it with hasJoined, so the identity is PROVEN rather than asserted.
          //
          // Never authenticate on the `world` string instead. It is documented
          // non-secret and ships in the browser bundle, so a public UUID would
          // be enough to impersonate anyone.
          //
          // `uuid` and `world` stay in `credentials` because the session's
          // smartRotomUser block below reports the live game values — they are
          // display data, never proof of anything.
          if (!credentials.serverId) {
            throw new AuthError("Minecraft identity was not proven", AUTH_ERROR_CODES.MISSING_CREDENTIALS);
          }
          // Only the declared fields: NextAuth folds csrfToken/callbackUrl/json into
          // `credentials`, and the API's strict DTOs reject unknown properties.
          const response = (
            await boffPOST<AuthLoginResponseEntity | { error: string }>(`/auth/minecraft/session`, {
              username: credentials.username,
              serverId: credentials.serverId,
            })
          ).data;
          if (response && !('error' in response)) {
            const { user } = response;
            return {
              id: String(user.id),
              username: user.username,
              // The API names this field `username`; the jwt callback maps it to
              // token.name, which AppWrapper's boffMediaLinked() gate requires.
              name: user.username,
              email: user.email,
              // Without these the MC session carries no roles/mcUuid — role-gated
              // features (e.g. ROTOM_ADMIN) silently reject every Minecraft login.
              roles: user.roles as UserRole[],
              mcUuid: user.mcUuid ?? undefined,
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
              // Prefer the live game credentials over the API's smartRotomUser,
              // which is `{}` when nothing is linked.
              smartRotomUser: {
                username: credentials.username,
                uuid: credentials.uuid,
                world: credentials.world
              }
            };
          }
          throw new AuthError("Invalid Minecraft credentials", AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        } catch (error) {
          throw handleAuthError(error);
        }
      }
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),
    ...(discordEnabled
      ? [
          DiscordProvider({
            clientId: env.DISCORD_ID,
            clientSecret: env.DISCORD_SECRET,
            authorization: { params: { scope: "identify email" } },
          }),
        ]
      : []),
    ...(twitchEnabled
      ? [
          TwitchProvider({
            clientId: env.TWITCH_CLIENT_ID,
            clientSecret: env.TWITCH_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // GoogleProfile is next-auth's real typed shape for this provider's profile;
          // `image` is kept as a defensive fallback in case the shape ever drifts.
          const googleProfile = profile as (GoogleProfile & { image?: string }) | undefined;
          const response = await boffPOST<AuthLoginResponseEntity>('/auth/google/callback', {
            email: profile?.email,
            name: profile?.name,
            picture: googleProfile?.picture ?? googleProfile?.image,
            googleId: googleProfile?.sub,
          });

          if (!response?.success || !response.data) {
            throw new Error('Failed to authenticate with backend');
          }

          const responseData = response.data;
          user.id = String(responseData.user.id);
          user.roles = responseData.user.roles as UserRole[];
          user.smartRotomUser = responseData.user.smartRotomUser ?? undefined;
          user.accessToken = responseData.access_token;
          user.refreshToken = responseData.refresh_token;

          return true;
        } catch (error) {
          console.error('Error in Google sign in:', error);
          return false;
        }
      }

      if (account?.provider === 'discord') {
        try {
          const p = profile as DiscordProfile | undefined;
          const avatar =
            p?.avatar && p?.id
              ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.${
                  p.avatar.startsWith('a_') ? 'gif' : 'png'
                }?size=256`
              : undefined;

          const response = await boffPOST<AuthLoginResponseEntity>('/auth/discord/callback', {
            discordId: p?.id,
            email: p?.email,
            name: p?.global_name ?? p?.username,
            picture: avatar,
          });

          if (!response?.success || !response.data) {
            throw new Error('Failed to authenticate with backend');
          }

          const responseData = response.data;
          user.id = String(responseData.user.id);
          user.roles = responseData.user.roles as UserRole[];
          user.smartRotomUser = responseData.user.smartRotomUser ?? undefined;
          user.accessToken = responseData.access_token;
          user.refreshToken = responseData.refresh_token;

          return true;
        } catch (error) {
          console.error('Error in Discord sign in:', error);
          return false;
        }
      }

      if (account?.provider === 'twitch') {
        try {
          const p = profile as TwitchProfile | undefined;
          const response = await boffPOST<AuthLoginResponseEntity>('/auth/twitch/callback', {
            twitchId: p?.sub,
            email: p?.email,
            name: p?.preferred_username,
            picture: p?.picture,
          });

          if (!response?.success || !response.data) {
            throw new Error('Failed to authenticate with backend');
          }

          const responseData = response.data;
          user.id = String(responseData.user.id);
          user.roles = responseData.user.roles as UserRole[];
          user.smartRotomUser = responseData.user.smartRotomUser ?? undefined;
          user.accessToken = responseData.access_token;
          user.refreshToken = responseData.refresh_token;

          return true;
        } catch (error) {
          console.error('Error in Twitch sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.username ?? user.name;
        token.roles = user.roles;
        token.smartRotomUser = user.smartRotomUser;
        token.image = user.profilePicture ?? user.image ?? null;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.lastUpdated = Date.now();
      }

      // Only refresh when explicitly requested or token is approaching expiry (55 min).
      // Never refresh on every page load (trigger === undefined) — that caused a
      // broken-refresh storm that prevented the access_token from ever being renewed.
      const shouldRefresh = trigger === 'update' ||
        !token.lastUpdated ||
        (Date.now() - (token.lastUpdated as number) > 55 * 60 * 1000);

      if (shouldRefresh && token.id && token.refreshToken) {
        try {
          const response = await boffPOST<AuthRefreshResponseEntity>('/auth/refresh', {
            refresh_token: token.refreshToken,
          });

          // Trust the envelope's own `success`, never a literal status: /auth/refresh
          // is a @Post with no @HttpCode, so it answers 201 and a `=== 200` check
          // silently discards every successful refresh.
          if (response?.success && response.data) {
            const userData = response.data;
            token.roles = userData.user.roles as UserRole[];
            token.name = userData.user.name;
            token.email = userData.user.email;
            token.smartRotomUser = userData.user.smartRotomUser ?? undefined;
            token.image = userData.user.image ?? token.image ?? null;
            token.accessToken = userData.access_token ?? token.accessToken;
            token.refreshToken = userData.refresh_token ?? token.refreshToken;
            token.lastUpdated = Date.now();
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        roles: token.roles as UserRole[],
        smartRotomUser: token.smartRotomUser as {
          username: string;
          uuid: string;
          world: string;
        } | undefined,
        image: token.image as string | null | undefined,
        accessToken: token.accessToken as string | undefined,
      } as BoffUser;
      return session;
    },
  },
  events: {},
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  secret: env.NEXTAUTH_SECRET,
  cookies: sessionCookie,
};