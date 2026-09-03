import { forwardRef } from "react";

const BASE =
  "font-ft-ui border-ft w-full min-w-0 rounded-ft-pill border-ft-ink bg-white px-4 py-3 text-[0.9375rem] " +
  "shadow-ft-pop-sm placeholder:text-ft-ink/45 focus:border-ft-pink focus:outline-none";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={`${BASE} ${className ?? ""}`} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      // A pill radius on a multi-line box clips the first and last lines.
      className={`${BASE} resize-y rounded-ft ${className ?? ""}`}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`${BASE} cursor-pointer font-bold ${className ?? ""}`}
      {...props}
    >
      {children}
    </select>
  );
});

/**
 * The boxier field used inside the editor's meta grid, where a row of eight
 * pill-shaped inputs would read as a pile of lozenges.
 */
export const MetaInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function MetaInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={[
        "font-ft-ui w-full rounded-ft-md border-ft-hair border-ft-ink bg-white",
        "px-3 py-2 text-sm placeholder:text-ft-ink/40 focus:border-ft-pink focus:outline-none",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
});
