import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button"; 
import { ReactNode } from "react";

export function BankSectionHeader({ children = 'Test' }: { children?: string }) {
    return (
        <div className="text-xl font-semibold text-blue-950 mb-4">{children}</div>
    );
}

export function BankSectionContent({ children }: { children: any }) {
    return (
        <div className="flex flex-col h-full overflow-hidden ">{children}</div>
    );
}

export function BankSectionFooter({ children }: { children?: ReactNode }) {
    return (
        <div className="p-1 text-sm text-left text-blue-950 hover:cursor-pointer">
            {children}
        </div>
    );
}

export function BankSection({ children, className }: { children: any, className?: string }) {
    return (
        <div className={`flex flex-col p-6  bg-white bg-opacity-90 rounded-md shadow-xl ${className}`}>
            {children}
        </div>
    );
}

export function BankSectionButton({ children, ...props }: ButtonProps) {
    return (
        <Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-950 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" {...props}>{children}</Button>
    );
}
