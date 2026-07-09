// Mirrors the API's PasswordService.validatePassword so the client can validate
// with parity and render a live requirements checklist. Keep in sync with
// apps/api/src/api/auth/password.service.ts.

const SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/

/** Always-shown positive requirements (rendered as a checklist). */
export const PASSWORD_RULES = [
  { id: "minLength", test: (v: string) => v.length >= 8 },
  { id: "lowercase", test: (v: string) => /[a-z]/.test(v) },
  { id: "uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { id: "number", test: (v: string) => /\d/.test(v) },
  { id: "special", test: (v: string) => SPECIAL.test(v) },
] as const

/** "Avoid" rules — only surfaced when violated. */
export const PASSWORD_WARNINGS = [
  { id: "noRepeat", test: (v: string) => !/(.)\1{2,}/.test(v) },
  { id: "noCommon", test: (v: string) => !/123|abc|qwe|password|admin/i.test(v) },
  { id: "maxLength", test: (v: string) => v.length <= 128 },
] as const

export type PasswordRuleId =
  | (typeof PASSWORD_RULES)[number]["id"]
  | (typeof PASSWORD_WARNINGS)[number]["id"]

export function passwordFailures(value: string): PasswordRuleId[] {
  return [...PASSWORD_RULES, ...PASSWORD_WARNINGS]
    .filter((r) => !r.test(value))
    .map((r) => r.id)
}

export function isPasswordValid(value: string): boolean {
  return passwordFailures(value).length === 0
}
