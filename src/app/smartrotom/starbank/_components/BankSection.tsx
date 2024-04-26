import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button"; 
import { ReactNode } from "react";

export function BankSectionHeader({ children = 'Test' }: { children?: string }) {
    return (
        <div className="text-2xl font-bold p-1 text-blue-950">{children}</div>
    );
}

export function BankSectionContent({ children }: { children: any }) {
    return (
        <div className="flex flex-col h-full overflow-hidden p-1">{children}</div>
    );
}

export function BankSectionFooter({ children }: { children?: ReactNode }) {
    return (
        <div className="p-1 text-sm text-right text-blue-950 hover:cursor-pointer">
            {children}
        </div>
    );
}

export function BankSection({ children, className }: { children: any, className?: string }) {
    return (
        <div className={`flex flex-col p-2 mb-2  bg-blue-50 bg-opacity-90 rounded-md shadow-xl ${className}`}>
            {children}
        </div>
    );
}

export function BankSectionButton({ children, ...props }: ButtonProps) {
    return (
        <Button className="bg-blue-900 hover:bg-blue-700" {...props}>{children}</Button>
    );
}
