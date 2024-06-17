"use client"
import Link from "next/link";

const subdomains = ['smartrotom', 'battlesim'];

export function InternalLink({ href, children, className, ...props }: { href: string, children: any, className?: string }) {
    const subdomain = window.location.host.split('.')[0];
    const currentApp = window.location.pathname.split('/')[1];
    for (let s of subdomains) {
        if (subdomain === s) {
            return (
                <Link href={href} {...props}>
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