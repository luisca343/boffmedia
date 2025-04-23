import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message: string;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center text-green-600/70 py-6 border border-dashed border-green-700/30 rounded ${className}`}>
      {icon && <div className="mx-auto mb-2 opacity-50 w-12 h-12 flex justify-center">{icon}</div>}
      {title && <p className="text-xl mb-2">{title}</p>}
      <p>{message}</p>
    </div>
  );
}