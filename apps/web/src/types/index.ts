import { DefaultSession, DefaultUser } from "next-auth"
import { RotomApp as SmartRotomApp, TaxiStop } from "@boffmedia/shared"
import type { UserRole } from "@boffmedia/shared/roles"

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
  /** Raw backend field name for the avatar URL — some auth responses send this instead of `image` */
  profilePicture?: string | null
  /** NestJS-signed JWT — use for Authorization: Bearer headers when calling guarded API endpoints */
  accessToken?: string
  /** NestJS-signed refresh token — used to silently renew accessToken */
  refreshToken?: string
  /**
   * True while an ADMIN sign-in is waiting on its second factor. The session
   * exists but carries no `accessToken`, so it can reach nothing; `TwoFactorGate`
   * routes the browser to /entrar/2fa until it is cleared.
   */
  twoFactorPending?: boolean
  /** false = the account has no second factor yet and must enrol before it can
   *  finish signing in. Admin 2FA is mandatory, so this is a step, not an offer. */
  twoFactorEnrolled?: boolean
  /** The API's short-lived `typ:'mfa'` token. Authenticates /auth/2fa/challenge/*
   *  and nothing else — it is not a session and grants no account powers. */
  challengeToken?: string
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

