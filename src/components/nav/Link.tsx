"use client"
import { subdomains } from "@/lib/utils";
import { on } from "events";
import Link from "next/link";


export function InternalLink({ href, children, className, onClick, ...props }: { href: string, children: any, className?: string, onClick?: any }) {
    if(onClick) {
        onClick()
    }

    // Check if window exists
    if (typeof window === 'undefined') {
        return (<Link href={href} {...props} className={className}>{children}</Link>);
    }

    const subdomain = window.location.host.split('.')[0];
    const currentApp = window.location.pathname.split('/')[1]

    if(currentApp === '') {
        return (
            <Link href={href} {...props}  className={className}>
                {children}
            </Link>
        );
    }

    for (let s of subdomains) {
        if (subdomain === s) {
            return (
                <Link href={href} {...props} className={className}>
                    {children}
                </Link>
            );
        }
    }
    return (
        <Link href={`/${currentApp}/${href}`} {...props} className={className}>
            {children}
        </Link>
    );
}