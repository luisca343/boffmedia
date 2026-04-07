import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/primitives/card";
import TerminalHeader from './TerminalHeader';

interface TerminalCardProps {
  children: ReactNode;
  title: string;
  description?: string;
  terminalTitle?: string;
  username?: string;
  showDate?: boolean;
  className?: string;
  roundedTop?: boolean;
}

export default function TerminalCard({
  children,
  title,
  description,
  terminalTitle,
  username,
  showDate = true,
  className = "",
  roundedTop = true
}: TerminalCardProps) {
  return (
    <>
      {terminalTitle && <TerminalHeader title={terminalTitle} username={username} showDate={showDate} />}
      
      <Card className={`bg-transparent border-highlight-500 border ${!roundedTop && "rounded-t-none"} ${className}`}>
        <CardHeader className="border-b border-highlight-700/50 pb-3">
          <CardTitle className="text-highlight-400 flex items-center">
            <span className="text-highlight-600 mr-2">&gt;</span>
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-highlight-600/80">
              <span className="text-highlight-600/60">{"//"} </span>
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {children}
        </CardContent>
      </Card>
    </>
  );
}