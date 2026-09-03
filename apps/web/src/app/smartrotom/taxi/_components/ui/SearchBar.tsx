import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

/** Search + sort, the destinations panel's one control row. */
export function SearchBar({
  value,
  onChange,
  sort,
  onToggleSort,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  sort: "near" | "far"
  onToggleSort: () => void
  placeholder?: string
}) {
  const t = useTranslations("taxi.searchBar")
  return (
    <div className="relative flex shrink-0 items-center gap-2">
      <span className="pointer-events-none absolute left-[0.8125rem] flex text-tx-txt-3">
        <Icon name="search" size={17} stroke={2.2} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("placeholderPh")}
        aria-label={t("search")}
        className={cn(
          "flex-1 rounded-tx-md py-3 pl-10 pr-3 text-sm outline-none",
          "bg-tx-surface border border-solid border-tx-line text-tx-txt placeholder:text-tx-txt-3",
          "transition-[border-color,box-shadow] duration-150",
          "focus:border-tx-accent focus:shadow-[0_0_0_3px_var(--tx-accent-soft)]",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clear")}
          className="absolute right-[3.625rem] flex p-1 text-tx-txt-3 hover:text-tx-txt"
        >
          <Icon name="x" size={15} />
        </button>
      )}
      <button
        type="button"
        onClick={onToggleSort}
        aria-label={sort === "near" ? t("sortFarthest") : t("sortNearest")}
        title={sort === "near" ? t("nearestFirst") : t("farthestFirst")}
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-tx-md",
          "bg-tx-surface border border-solid transition-[background,color] duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
          sort === "far"
            ? "border-tx-accent-soft text-tx-accent"
            : "border-tx-line text-tx-txt-2 hover:bg-tx-surface-2 hover:text-tx-txt",
        )}
      >
        <Icon name="sort" size={16} stroke={2} />
      </button>
    </div>
  )
}
