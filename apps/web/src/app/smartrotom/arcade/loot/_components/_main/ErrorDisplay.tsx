import { ReactNode } from "react";

interface ErrorDisplayProps {
  error: string | null;
  type?: "error" | "warning" | "info";
  children?: ReactNode;
}

export function ErrorDisplay({ error, type = "error", children }: ErrorDisplayProps) {
  if (!error && !children) return null;
  
  const styles = {
    error: "bg-red-900/70 text-white border-2 border-red-500/40",
    warning: "bg-yellow-900/70 text-white border-2 border-yellow-500/40",
    info: "bg-secondary-soft/70 text-white border-2 border-secondary/40"
  };
  
  return (
    <div className={`p-4 rounded-lg mb-6 text-center ${styles[type]}`}>
      {error || children}
    </div>
  );
}