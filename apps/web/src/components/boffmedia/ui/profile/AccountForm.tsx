"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Field, Input, Textarea } from "@boffmedia/ui"

export interface AccountFormValues {
  name: string
  email: string
  bio?: string
}

export interface AccountFormProps {
  values: AccountFormValues
  editing?: boolean
  onChange?: (field: keyof AccountFormValues, value: string) => void
  /** Show the bio field (backed by the user `bio` column). */
  showBio?: boolean
  className?: string
}

export function AccountForm({ values, editing = false, onChange, showBio, className }: AccountFormProps) {
  const t = useTranslations("profile")
  const disabled = !editing
  return (
    <div className={cn("grid grid-cols-2 gap-4 max-[720px]:grid-cols-1", className)}>
      <Field label={t("form.name")}>
        <Input
          type="text"
          value={values.name}
          disabled={disabled}
          onChange={(e) => onChange?.("name", e.target.value)}
        />
      </Field>
      <Field label={t("form.email")}>
        <Input
          type="email"
          value={values.email}
          disabled={disabled}
          onChange={(e) => onChange?.("email", e.target.value)}
        />
      </Field>
      {showBio && (
        <Field label={t("form.bio")} className="col-span-full">
          <Textarea
            rows={3}
            value={values.bio ?? ""}
            disabled={disabled}
            onChange={(e) => onChange?.("bio", e.target.value)}
          />
        </Field>
      )}
    </div>
  )
}
