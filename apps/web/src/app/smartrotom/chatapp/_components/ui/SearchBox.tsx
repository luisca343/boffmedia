import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: ReactNode;
  className?: string;
  autoFocus?: boolean;
  iconSize?: number;
};

/** Rounded search field with a leading icon + optional trailing slot (⌘K hint / clear). */
export const SearchBox = forwardRef<HTMLInputElement, Props>(function SearchBox(
  { value, onChange, placeholder, right, className, autoFocus, iconSize = 17 },
  ref,
) {
  return (
    <div
      className={cn(
        "flex items-center gap-[0.6875rem] rounded-[9px] border border-transparent bg-ca-search-bg px-[0.8125rem] py-2 shadow-[inset_0_0_0_1px_rgb(var(--ca-700)/.5)] transition-[border-color,box-shadow] duration-[120ms] focus-within:border-ca-accent/50 focus-within:shadow-[0_0_0_2px_rgb(var(--ca-accent)/.14)]",
        className,
      )}
    >
      <Icon name="search" size={iconSize} className="flex-none text-ca-500" />
      <input
        ref={ref}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-none bg-transparent text-[0.875rem] text-ca-50 outline-none placeholder:text-ca-500"
      />
      {right}
    </div>
  );
});
