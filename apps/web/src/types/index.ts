import { DefaultSession, DefaultUser } from "next-auth"
import { SmartRotomApp, TaxiStop } from "@boffmedia/shared"
import type { UserRole } from "@boffmedia/shared"

export type SmartRotomAppExtended = SmartRotomApp & { order?: number }

export type TaxiStopExtended = TaxiStop & { distance?: number; description?: string }

export type SmartRotomUser = {
  username: string
  uuid: string
  world: string | null
}

export interface BoffUser { //extends DefaultUser {
  id: string
  email: string
  username: string
  mcUuid?: string
  roles: UserRole[]
  smartRotomUser?: SmartRotomUser
  discordId?: string
  image?: string | null
  /** NestJS-signed JWT — use for Authorization: Bearer headers when calling guarded API endpoints */
  accessToken?: string
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

