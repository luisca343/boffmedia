"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { PASSWORD_RULES, PASSWORD_WARNINGS } from "./passwordPolicy"

/**
 * Live password-requirements checklist. The positive rules always show (met =
 * green tick, unmet = dim dot); the "avoid" rules only appear, in red, when the
 * current value violates them.
 */
export function PasswordRequirements({ value }: { value: string }) {
  const t = useTranslations("auth")

  return (
    <ul className="flex flex-col gap-[0.3125rem] font-body text-[0.78125rem]/[1.3] not-italic normal-case">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li key={rule.id} className={`flex items-center gap-2 ${ok ? "text-success" : "text-txt-dim"}`}>
            <span
              aria-hidden
              className={`grid h-[0.9375rem] w-[0.9375rem] flex-none place-items-center rounded-full text-[0.5625rem] font-bold ${
                ok ? "bg-success/15 text-success" : "border border-line-2 text-transparent"
              }`}
            >
              ✓
            </span>
            {t(`pw.${rule.id}`)}
          </li>
        )
      })}

      {PASSWORD_WARNINGS.map((rule) => {
        const violated = value.length > 0 && !rule.test(value)
        if (!violated) return null
        return (
          <li key={rule.id} className="flex items-center gap-2 text-danger">
            <span
              aria-hidden
              className="grid h-[0.9375rem] w-[0.9375rem] flex-none place-items-center rounded-full bg-danger/15 text-[0.5625rem] font-bold"
            >
              ✕
            </span>
            {t(`pw.${rule.id}`)}
          </li>
        )
      })}
    </ul>
  )
}
