import { useTranslations } from "next-intl";
import { useGlobalErrorStore } from "@/stores/globalErrorStore";
import { RotomErrorPage } from "./RotomError";
import { RotomAppError } from "./RotomErrorBoundary";

export function GlobalErrorThrower({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common.error");
  const error = useGlobalErrorStore((s) => s.error);

  if (error) {
    if (error instanceof RotomAppError) {
      return <RotomErrorPage error={error.message} help={error.help} />;
    }
    return <RotomErrorPage error={error.message || t("unknown")} />;
  }

  return children;
}