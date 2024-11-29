import { NextAuthOptions } from "next-auth"
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
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('==== SIGN IN ====');
      console.log('User:', user);
      console.log('Account:', account);
      console.log('Profile:', profile);
      if (account?.provider === 'google') {

        console.log('Sending Google callback to backend: ', {
          email: profile?.email,
          name: profile?.name,
          picture: profile?.image
        });
        
        try {
          const response = await boffPOST('/users/google/callback', { 
            email: profile?.email,
            name: profile?.name,
            picture: profile?.image
          });
          
          console.log('Google callback response:', response);

          if (!response.ok) {
            throw new Error('Failed to authenticate with backend');
          }

          const userData = await response.user;
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
      console.log('==== JWT ====');
      console.log('Token:', token);
      console.log('User:', user);
      console.log('Account:', account);
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
  secret: process.env.AUTH_SECRET,
}

