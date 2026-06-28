import React, { ReactNode } from 'react';
import { Label } from "@/components/ui/primitives/label";

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
    <Label htmlFor={htmlFor} className="text-warning-hover text-sm flex items-center">
      {indicator === 'comment' ? (
        <span className="text-warning/70 mr-1">{"//"}</span>
      ) : (
        <span className="w-2 h-2 bg-warning rounded-full mr-2"></span>
      )}
      {children}
      {required && <span className="text-warning ml-2">(obligatorio)</span>}
    </Label>
  );
}