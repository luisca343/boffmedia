import { Button } from "@/components/ui/primitives/button";
import { ButtonProps } from "@/components/ui/primitives/button"; 
import { ReactNode } from "react";

export function BankSectionHeader({ children = 'Test' }: { children?: string | ReactNode }) {
    return (
        <div className="text-2xl font-semibold text-blue-800 mb-4">{children}</div>
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

interface BankSectionProps {
    children: any;
    className?: string;
    variant?: "normal" | "noPadding";
  }
  
  export function BankSection({ children, className, variant = "normal" }: BankSectionProps) {
    return (
      <div className={`flex flex-col ${variant === "normal" ? "p-6" : ""} bg-white bg-opacity-90 rounded-md border border-blue-200 ${className}`}>
        {children}
      </div>
    );
  }

export function BankSectionButton({ children, ...props }: ButtonProps) {
    return (
        <Button variant="secondary" className="inline-flex items-center px-4 py-2" {...props}>{children}</Button>
    );
}
