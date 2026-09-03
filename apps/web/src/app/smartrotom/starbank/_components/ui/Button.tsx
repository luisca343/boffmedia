import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "glass" | "solid";
type Size = "md" | "sm" | "lg" | "icon";

const VARIANT: Record<Variant, string> = {
  primary: "bg-sb-600 text-white shadow-sb-brand hover:bg-sb-700 active:translate-y-px",
  secondary: "bg-sb-surface text-sb-fg border-sb-border hover:bg-sb-surface-2 hover:border-sb-border-strong",
  ghost: "text-sb-700 hover:bg-sb-50",
  danger: "bg-sb-neg text-white hover:brightness-110",
  glass: "bg-white/[0.13] text-white border-white/[0.22] backdrop-blur-[8px] hover:bg-white/[0.22]",
  solid: "bg-white text-sb-900 hover:bg-white/90",
};

const SIZE: Record<Size, string> = {
  md: "px-3.5 py-[0.5625rem] text-[0.84375rem]",
  sm: "px-2.5 py-1.5 text-[0.78125rem]",
  lg: "px-[1.125rem] py-3 text-[0.90625rem]",
  icon: "p-2",
};

const BASE =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sb-md border border-transparent font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-55";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };
type ButtonAsLink = CommonProps & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">;

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "secondary", size = "md", className, children, ...rest } = props as ButtonAsLink;
  const cls = cn(BASE, VARIANT[variant], SIZE[size], className);

  if ("href" in props && props.href != null) {
    const { href, ...anchorRest } = rest;
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={cls} {...(anchorRest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={cls} {...(anchorRest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
