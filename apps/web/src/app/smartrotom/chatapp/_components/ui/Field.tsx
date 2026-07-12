import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Filled text input with an accent underline (group name, etc.). */
export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Field(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-t-ca-sm border-x-0 border-b-2 border-t-0 border-solid border-ca-accent bg-ca-search-bg px-[13px] py-[11px] text-[14.5px] text-ca-50 outline-none placeholder:text-ca-500",
        className,
      )}
      {...rest}
    />
  );
});
