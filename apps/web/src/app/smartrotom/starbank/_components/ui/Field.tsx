import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, children, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.02em] text-sb-fg-muted", className)} {...rest}>
      {children}
    </label>
  );
}

const CONTROL =
  "h-10 w-full rounded-sb-md border border-sb-border bg-sb-surface px-3 text-sb-fg outline-none transition-colors focus:border-sb-400 focus-visible:shadow-sb-focus";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(CONTROL, className)} {...rest} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(CONTROL, "appearance-none", className)} {...rest}>
      {children}
    </select>
  );
});
