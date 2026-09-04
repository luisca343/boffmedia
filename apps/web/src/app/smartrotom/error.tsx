"use client"
import { useEffect } from "react";
import { RotomErrorPage } from "@/components/smartrotom/RotomError";
import { RotomAppError } from "@/components/smartrotom/RotomErrorBoundary";
import { reportBoundaryError } from "@/lib/sentry";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  // The phone shell itself crashed, above every per-app boundary — a different
  // and worse failure than one app dying, so it gets its own tag rather than
  // sharing `smartrotom/<app>` with AppErrorFallback.
  useEffect(() => {
    reportBoundaryError(error, {
      boundary: "smartrotom/shell",
      digest: (error as Error & { digest?: string }).digest,
    });
  }, [error]);

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