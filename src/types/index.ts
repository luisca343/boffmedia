import { DefaultSession, DefaultUser } from "next-auth"

export type SmartRotomUser = {
  name: string
  uuid: string
  world: string | null
}

export interface BoffUser { //extends DefaultUser {
  id: string
  email: string
  username: string
  mcUuid?: string
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

export type App = {
  id: number
  name: string
  url: string
  active: number
}

export type SuccessResponse = {
  success: boolean
}

export type SuccessResponseWithId = {
  success: boolean
  id: number
}