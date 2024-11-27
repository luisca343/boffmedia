import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { boffPOST } from '@/services/boffAPI'
import { BoffUser } from "@/types"

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
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password")
        }
        const user = await boffPOST(`/users/login`, credentials)
        if (user && !user.error) {
          return user as BoffUser
        }
        return null
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
        if (!credentials?.username || !credentials?.uuid || !credentials?.world) {
          throw new Error("Missing required Minecraft credentials")
        }
        const user = await boffPOST(`/users/loginmc`, credentials)
        if (user && !user.error) {
          return {
            ...user,
            smartRotomUser: {
              username: credentials.username,
              uuid: credentials.uuid,
              world: credentials.world
            }
          } as BoffUser
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.username = user.username
        token.roles = user.roles
        token.smartRotomUser = user.smartRotomUser
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        email: token.email,
        username: token.username,
        roles: token.roles,
        smartRotomUser: token.smartRotomUser
      } as BoffUser
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Emit user sign in event to all connected clients
      console.log('User signed in =>', user)
    },
    async signOut({ token }) {
      // Emit user sign out event to all connected clients
      console.log('User signed out =>', token)
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}