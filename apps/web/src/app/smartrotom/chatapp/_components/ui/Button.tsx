import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-ca-accent text-ca-on-accent hover:brightness-[1.06] disabled:cursor-default disabled:bg-ca-700 disabled:text-ca-500 disabled:brightness-100",
  ghost: "bg-transparent text-ca-accent-soft hover:bg-ca-accent/10",
};

const BASE =
  "inline-flex select-none items-center justify-center gap-[7px] rounded-[24px] px-[18px] py-2.5 text-[14.5px] font-semibold transition-[background-color,color,filter,transform] duration-[120ms] active:scale-[.97] disabled:pointer-events-none";

type Common = { variant?: Variant; className?: string; children?: ReactNode };
type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };
type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">;

export function Button(props: AsButton | AsLink) {
  const { variant = "primary", className, children, ...rest } = props as AsLink;
  const cls = cn(BASE, VARIANT[variant], className);

  if ("href" in props && props.href != null) {
    const { href, ...anchorRest } = rest;
    const Cmp = href.startsWith("/") ? Link : "a";
    return (
      <Cmp href={href} className={cls} {...(anchorRest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Cmp>
    );
  }
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
