import { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { boffPOST } from '@/services/boffAPI'
import { BoffUser } from "@/types"
import { AuthError, AUTH_ERROR_CODES, handleAuthError } from '@/utils/auth-errors'

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
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new AuthError("Missing username or password", AUTH_ERROR_CODES.MISSING_CREDENTIALS);
          }
          const user = await boffPOST(`/users/login`, credentials);
          if (user && !user.error) {
            return user;
          }
          throw new AuthError("Invalid credentials", AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        } catch (error) {
          throw handleAuthError(error);
        }
      }
    }),
    CredentialsProvider({
      id: "minecraft",
      name: "Minecraft",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        uuid: { label: "UUID", type: "text" },
        world: { label: "World", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.uuid || !credentials?.world) {
            throw new AuthError("Missing required Minecraft credentials", AUTH_ERROR_CODES.MISSING_CREDENTIALS);
          }
          const user = await boffPOST(`/users/loginmc`, credentials);
          if (user && !user.error) {
            return {
              ...user,
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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.roles = user.roles;
        token.smartRotomUser = user.smartRotomUser;
      }
      if (account && account.provider === "google") {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/google/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: account.access_token }),
          });
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          token = { ...token, ...data };
        } catch (error) {
          console.error("Error in Google callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        username: token.username as string,
        roles: token.roles as string[],
        smartRotomUser: token.smartRotomUser as {
          username: string;
          uuid: string;
          world: string;
        } | undefined
      } as BoffUser;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Handle Google sign-in event
        console.log('Google user signed in:', user);
      }
    },
    async signOut({ token }) {
      // logger.info('User signed out', { userId: token.id });
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  secret: process.env.AUTH_SECRET,
}

