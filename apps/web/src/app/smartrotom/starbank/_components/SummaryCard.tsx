import React, { ReactNode } from 'react';

type SummaryCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

export function SummaryCard({ title, value, icon, change, className = '' }: SummaryCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-blue-200 p-5 ${className}`}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-blue-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`text-xs font-medium ${
                  change.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {change.isPositive ? '▲' : '▼'} {Math.abs(change.value)}%
              </span>
              <span className="text-xs text-blue-500 ml-1">desde el mes pasado</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}