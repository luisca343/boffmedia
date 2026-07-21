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
      />
    );
  }
  return (
    <RotomErrorPage error={error.message || undefined} onAction={reset} />
  );
}