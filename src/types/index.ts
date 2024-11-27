import { DefaultSession, DefaultUser } from "next-auth"

export type SmartRotomUser = {
  username: string
  uuid: string
  world: string | null
}

export interface BoffUser extends DefaultUser {
  id: string
  email: string
  username: string
  roles: string[]
  smartRotomUser?: SmartRotomUser
  discordId?: string
}

declare module "next-auth" {
  interface Session {
    user: BoffUser & DefaultSession["user"]
  }

  interface User extends BoffUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends BoffUser {}
}

