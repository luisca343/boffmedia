import React, { ReactNode } from 'react';
import { Label } from "@/components/ui/label";

interface TerminalLabelProps {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  indicator?: 'comment' | 'dot';
}

export default function TerminalLabel({
  htmlFor,
  children,
  required = false,
  indicator = 'comment'
}: TerminalLabelProps) {
  return (
    <Label htmlFor={htmlFor} className="text-green-400 text-sm flex items-center">
      {indicator === 'comment' ? (
        <span className="text-green-600/70 mr-1">{"//"}</span>
      ) : (
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
      )}
      {children}
      {required && <span className="text-green-600 ml-2">(obligatorio)</span>}
    </Label>
  );
}