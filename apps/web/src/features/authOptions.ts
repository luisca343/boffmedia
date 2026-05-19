import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "@/config/env";
import { boffPOST } from '@/services/boffAPI';
import { BoffUser } from "@/types";
import type { UserRole } from "@boffmedia/shared/roles";
import { AuthError, AUTH_ERROR_CODES, handleAuthError } from '@/utils/auth-errors';
import { CookiesOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
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

          const response = (await boffPOST(`/auth/login`, {
            username: credentials.username,
            password: credentials.password,
          })).data as any;

          if (response && !response.error) {
            return { ...response.user, accessToken: response.access_token, refreshToken: response.refresh_token } as any;
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
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
        world: { label: "World", type: "text" }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.username || !credentials?.uuid || !credentials?.world) {
            throw new AuthError("Missing required Minecraft credentials", AUTH_ERROR_CODES.MISSING_CREDENTIALS);
          }
          const response = (await boffPOST(`/auth/loginmc`, credentials)).data as any;
          if (response && !response.error) {
            const responseData = response.user as any;
            const user: any = {
              id: responseData.id,
              name: responseData.name,
              email: responseData.email,
              image: responseData.image,
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
              smartRotomUser: {
                username: credentials.username,
                uuid: credentials.uuid,
                world: credentials.world
              }
            };
            return user;
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
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const response = (await boffPOST('/auth/google/callback', {
            email: profile?.email,
            name: profile?.name,
            picture: (profile as any)?.picture ?? (profile as any)?.image,
          })) as any;

          if (!response.statusCode || response.statusCode !== 200) {
            throw new Error('Failed to authenticate with backend');
          }

          const responseData = response.data;
          user.id = responseData.user.id;
          (user as any).roles = responseData.user.roles;
          (user as any).smartRotomUser = responseData.user.smartRotomUser;
          (user as any).accessToken = responseData.access_token;
          (user as any).refreshToken = responseData.refresh_token;

          return true;
        } catch (error) {
          console.error('Error in Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = (user as any).username ?? user.name;
        token.roles = (user as any).roles;
        token.smartRotomUser = (user as any).smartRotomUser;
        token.image = (user as any).profilePicture ?? user.image ?? null;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
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
          const response = (await boffPOST('/auth/refresh', {
            refresh_token: token.refreshToken,
          })) as any;

          if (response && response.statusCode === 200) {
            const userData = response.data;
            token.roles = userData.user.roles;
            token.name = userData.user.name;
            token.email = userData.user.email;
            token.smartRotomUser = userData.user.smartRotomUser;
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
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: env.NODE_ENV === 'production' ? '.boffmedia.es' : '.ficuslab.es'
      }
    }
  } as Partial<CookiesOptions>,
};