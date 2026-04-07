"use client"
import { RotomErrorPage } from "@/components/smartrotom/RotomError";
import { RotomAppError } from "@/components/smartrotom/RotomErrorBoundary";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  if (error instanceof RotomAppError) {
    return (
      <RotomErrorPage
        errorCode={error.errorCode as any}
        context={error.context}
        onAction={reset}
        actionText="Reintentar"
      />
    );
  }
  // fallback for unknown errors
  return (
    <RotomErrorPage error={error.message || 'Error desconocido'} onAction={reset} actionText="Reintentar" />
  );
}