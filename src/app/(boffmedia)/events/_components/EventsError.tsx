import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface EventsErrorProps {
  error: string;
  onRetry: () => void;
}

export function EventsError({ error, onRetry }: EventsErrorProps) {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-warning-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-surface-50">Error al cargar los eventos</h2>
        <p className="text-surface-300 mb-6 max-w-md">{error}</p>
        <Button onClick={onRetry} className="bg-primary-500 hover:bg-primary-600">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}