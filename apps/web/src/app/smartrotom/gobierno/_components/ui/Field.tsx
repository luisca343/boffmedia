"use client"

import { useTranslations } from "next-intl"
import { Icon, type IconName } from "./Icon"

const BASE =
  "w-full rounded-gt-sm border border-gt-line-strong bg-gt-paper-0 px-3 py-[0.5625rem] text-[0.8125rem] font-medium text-gt-ink-900 placeholder:text-gt-ink-400 focus:border-gt-accent focus:outline-none focus:ring-[3px] focus:ring-gt-accent-tint"

export function Field({
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  mono = false,
  className = "",
  label,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: "text" | "number" | "date" | "datetime-local"
  icon?: IconName
  mono?: boolean
  className?: string
  label?: string
  id?: string
}) {
  const input = (
    <div className="relative w-full">
      {icon && (
        <Icon
          name={icon}
          size={15}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gt-ink-400"
        />
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={`${BASE} ${icon ? "pl-[2.0625rem]" : ""} ${mono ? "font-gt-mono" : "font-gt"} ${className}`}
      />
    </div>
  )
  return label ? (
    <label className="block">
      <span className="mb-1.5 block font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
        {label}
      </span>
      {input}
    </label>
  ) : (
    input
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  label,
  className = "",
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  label?: string
  className?: string
  id?: string
}) {
  const el = (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      aria-label={label ?? placeholder}
      className={`${BASE} resize-none font-gt leading-normal ${className}`}
    />
  )
  return label ? (
    <label className="block">
      <span className="mb-1.5 block font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
        {label}
      </span>
      {el}
    </label>
  ) : (
    el
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label?: string
  className?: string
}) {
  const el = (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`${BASE} cursor-pointer appearance-none pr-8 font-gt ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevronDown"
        size={15}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gt-ink-400"
      />
    </div>
  )
  return label ? (
    <label className="block">
      <span className="mb-1.5 block font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
        {label}
      </span>
      {el}
    </label>
  ) : (
    el
  )
}

// The filter row above every register: a search box plus any number of selects.
export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const t = useTranslations("gobierno")
  return (
    <Field value={value} onChange={onChange} placeholder={placeholder ?? t("common.search")} icon="search" />
  )
}
