import React from 'react';

interface TerminalHeaderProps {
  title?: string;
  username?: string;
  showDate?: boolean;
}

export default function TerminalHeader({ 
  title = "terminal", 
  username = "ficus-labs", 
  showDate = true 
}: TerminalHeaderProps) {
  return (
    <div className="border border-warning-border rounded-t-md bg-warning-soft/30 px-4 py-1 flex justify-between items-center">
      <div className="flex space-x-2 items-center">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-warning"></div>
      </div>
      <div className="text-xs text-warning-hover">{`${title}@${username}:~`}</div>
      {showDate && <div className="text-xs text-warning-hover">{new Date().toISOString().split('T')[0]}</div>}
    </div>
  );
}