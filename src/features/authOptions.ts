import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { boffPOST } from '@/services/boffAPI';
import { BoffUser } from "@/types";
import { AuthError, AUTH_ERROR_CODES, handleAuthError } from '@/utils/auth-errors';
import { CookiesOptions } from "next-auth";
import { User } from "@/services/api/smartrotom/usersService";



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
            throw new AuthError("Missing username or password", AUTH_ERROR_CODES.MISSING_CREDENTIALS);
          }
          const response = (await boffPOST(`/users/login`, credentials)).data as any;
          if (response && !response.error) {
            return response.data as User;
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
      async authorize(credentials, req) {
        try {
          if (!credentials?.username || !credentials?.uuid || !credentials?.world) {
            throw new AuthError("Missing required Minecraft credentials", AUTH_ERROR_CODES.MISSING_CREDENTIALS);
          }
          const response = (await boffPOST(`/users/loginmc`, credentials)).data as any;
          if (response && !response.error) {
            const responseData = response.data as any;
            const user: User = {
              id: responseData.id,
              name: responseData.name,
              email: responseData.email,
              image: responseData.image,
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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        console.log('Sending Google callback to backend: ', {
          email: profile?.email,
          name: profile?.name,
          picture: profile?.image
        });
        
        try {
          const response = (await boffPOST('/users/google/callback', { 
            email: profile?.email,
            name: profile?.name,
            picture: profile?.image
          })).data as any;
          
          console.log('Google callback response:', response);

          if (!response.statusCode || response.statusCode !== 200) {
            throw new Error('Failed to authenticate with backend');
          }

          const userData = await response.data.user;
          user.id = userData.id;
          user.roles = userData.roles;
          user.smartRotomUser = userData.smartRotomUser;

          return true;
        } catch (error) {
          console.error('Error in Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roles = user.roles;
        token.smartRotomUser = user.smartRotomUser;
      }
      if (account && account.provider === "google") {
        token.accessToken = account.access_token;
      }
      console.log('JWT token:', token);
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        roles: token.roles as string[],
        smartRotomUser: token.smartRotomUser as {
          username: string;
          uuid: string;
          world: string;
        } | undefined
      } as BoffUser;
      console.log('Session:', session);
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        console.log('Google user signed in:', user);
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        domain: process.env.NODE_ENV === 'production' ? '.boffmedia.es' : '.ficuslab.es'
      }
    }
  } as Partial<CookiesOptions>,
};

