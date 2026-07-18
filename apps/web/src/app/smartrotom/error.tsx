"use client"
import { RotomErrorPage } from "@/components/smartrotom/RotomError";
import { RotomAppError } from "@/components/smartrotom/RotomErrorBoundary";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  if (error instanceof RotomAppError) {
    return (
      <RotomErrorPage
        error={error.message}
        help={error.help}
        onAction={reset}
        actionText="Reintentar"
      />
    );
  }
  return (
    <RotomErrorPage error={error.message || 'Error desconocido'} onAction={reset} actionText="Reintentar" />
  );
}