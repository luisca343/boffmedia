import { useGlobalErrorStore } from "@/stores/globalErrorStore";
import { RotomErrorPage } from "./RotomError";
import { RotomAppError } from "./RotomErrorBoundary";

export function GlobalErrorThrower({ children }: { children: React.ReactNode }) {
  const error = useGlobalErrorStore((s) => s.error);

  if (error) {
    if (error instanceof RotomAppError) {
      return (
        <RotomErrorPage
          errorCode={error.errorCode as any}
          context={error.context}
        />
      );
    }
    return <RotomErrorPage error={error.message || "Error desconocido"} />;
  }

  return children;
}