import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { boffPOST } from '@/services/boffAPI';
import { BoffUser } from "@/types";
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
            console.log("Missing credentials");
            return null;
          }
          
          console.log("Attempting to authenticate with boffAPI:", credentials.username);
          const response = (await boffPOST(`/auth/login`, {
            username: credentials.username,
            password: credentials.password,
          })).data as any;
          
          if (response && !response.error) {
            console.log("Authentication successful");
            return response.user as any; // TODO - CREATE FULL USER TYPE
          }
          
          console.log("Authentication failed - invalid response:", response);
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null; // Return null instead of throwing
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
            const user: any = {  // TODO - CREATE FULL USER TYPE
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
        
        try {
          const response = (await boffPOST('/auth/google/callback', { 
            email: profile?.email,
            name: profile?.name,
            picture: profile?.image
          })) as any;

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
    async jwt({ token, user, account, trigger }) {
      // If this is a new sign-in, update token with user data
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.username;
        token.roles = user.roles;
        token.smartRotomUser = user.smartRotomUser;
        token.image = (user as any).profilePicture ?? user.image ?? null;
        token.lastUpdated = Date.now();
      }

      // Refresh user data when:
      // 1. Explicitly requested (trigger === 'update')
      // 2. No lastUpdated timestamp exists (first time)
      // 3. Data is older than 2 minutes
      // 4. Trigger is undefined (page refresh/reload)
      const shouldRefresh = trigger === 'update' || 
        !token.lastUpdated || 
        (Date.now() - (token.lastUpdated as number) > 2 * 60 * 1000) || // 2 minutes
        trigger === undefined; // This covers page refresh scenarios
      
      if (shouldRefresh && token.id) {
        try {
          
          // Send the token object directly to the backend
          const response = (await boffPOST('/auth/refresh', { 
            refresh_token: token // Send the entire token object
          })) as any;
          
          if (response && response.statusCode === 200) {
            const userData = response.data;
            
            token.roles = userData.user.roles;
            token.name = userData.user.name;
            token.email = userData.user.email;
            token.smartRotomUser = userData.user.smartRotomUser;
            token.image = userData.user.image ?? token.image ?? null;
            token.lastUpdated = Date.now();
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
          // Don't update lastUpdated on error to retry sooner
        }
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
        } | undefined,
        image: token.image as string | null | undefined
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